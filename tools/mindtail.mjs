#!/usr/bin/env node
// Bookkeeping for MINDTAIL Shorts (branch mindtail): .github/workflows/mindtail.yml + the mindtail-script /
// mindtail-edit skills. Claude writes and edits; this file answers the questions a workflow can't leave to judgment.
//
// A Short lives in its own folder in config/mindtail.json → series (Drive: MINDTAIL/inbox/shorts/):
//   MT-0001-phone-habit/
//     MT-0001_script.md       scenes, Screen directions, sources, title ideas   (Claude, script step)
//     MT-0001_voiceover.txt   the Hindi text the owner pastes into ElevenLabs  (Claude, script step)
//     <any name>.mp3|.wav     the voiceover audio                              (the owner uploads it)
//     brief.txt               optional per-Short style words                    (the owner)
//
// Usage:
//   node tools/mindtail.mjs status                 every Short and what it waits for
//   node tools/mindtail.mjs next-ids [n]           the next n free IDs (MT-0001 …) for the script step
//   node tools/mindtail.mjs script-check           validates mindtail-script.json + every Short it lists
//   node tools/mindtail.mjs ready [MT-0001] [--max n]   Shorts with audio and no finished edit (or the one named)
//   node tools/mindtail.mjs check <folder>         mindtail-run.json + final-9x16.mp4 + verify for one Short
//   node tools/mindtail.mjs done <folder>          records it in config/mindtail-state.json
// In GitHub Actions answers are also written to $GITHUB_OUTPUT.
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { PROJECTS, ROOT, die, parseCli, readJson, run, writeJson } from "./lib/common.mjs";
import { MEDIA_EXT } from "./lib/inbox.mjs";

const CONFIG = join(ROOT, "config", "mindtail.json");
const STATE = join(ROOT, "config", "mindtail-state.json");
const SCRIPT_RESULT = join(ROOT, "mindtail-script.json");
const RUN_RESULT = join(ROOT, "mindtail-run.json");
const FOLDER = /^MT-\d{4}(-[a-z0-9-]+)?$/i;

const { positional, flags } = parseCli();
const [cmd, arg] = positional;
const config = readJson(CONFIG);
const state = existsSync(STATE) ? readJson(STATE) : { done: [] };
const series = join(ROOT, config.series);
const rel = (...parts) => join(...parts).replace(/\\/g, "/");

function output(values) {
  console.log(JSON.stringify(values, null, 2));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(values).map(([k, v]) => `${k}=${v ?? ""}\n`).join(""));
}

const idOf = (folder) => folder.slice(0, 7).toUpperCase();
const folders = () => (existsSync(series) ? readdirSync(series) : [])
  .filter((n) => FOLDER.test(n) && statSync(join(series, n)).isDirectory())
  .sort();
const filesOf = (f) => readdirSync(join(series, f)).filter((n) => !n.startsWith("."));
const audiosOf = (f) => filesOf(f).filter((n) => MEDIA_EXT.includes(extname(n).toLowerCase()));
const voiceoverOf = (f) => filesOf(f).find((n) => /_voiceover\.txt$/i.test(n));
const scriptOf = (f) => filesOf(f).find((n) => /_script\.md$/i.test(n));
const isDone = (f) => state.done.some((d) => d.short === f);

function stageOf(f) {
  if (isDone(f)) return "done";
  const audios = audiosOf(f);
  if (audios.length > 1) return "several-audio-files";
  if (audios.length === 1) return "ready-to-edit";
  if (!voiceoverOf(f)) return "needs-script";
  return "waiting-for-voice";
}

/** Problems with a voiceover the owner will paste into ElevenLabs as-is. */
function voiceoverProblems(text) {
  const problems = [];
  const words = text.split(/\s+/).filter(Boolean).length;
  const [min, max] = config.voiceoverWords;
  if (words < min || words > max) problems.push(`${words} words (allowed ${min}-${max})`);
  if (!/[ऀ-ॿ]/.test(text)) problems.push("no Devanagari text: the voiceover must be Hindi");
  if (/[{}<>\[\]]/.test(text)) problems.push("brackets/braces would be read out or treated as tags");
  if (/[0-9०-९]/.test(text)) problems.push("digits: write numbers as words");
  if (/https?:|www\./i.test(text)) problems.push("a URL would be read out");
  if (/^\s*[#*>-]|[*_`|]/m.test(text)) problems.push("markdown symbols would be read out");
  if (/[%₹$@&=+]/.test(text)) problems.push("symbols (%, ₹, $, &, …): write them as words");
  return { words, problems };
}

if (cmd === "status") {
  const all = folders();
  if (!all.length) console.log(`no Shorts yet in ${config.series}`);
  for (const f of all) console.log(`${f.padEnd(40)} ${stageOf(f)}`);
} else if (cmd === "next-ids") {
  const n = Math.max(1, Number(arg) || config.scriptBatch || 1);
  const used = new Set([...folders().map(idOf), ...state.done.map((d) => idOf(d.short))]);
  let k = Math.max(0, ...[...used].map((id) => Number(id.slice(3)))) + 1;
  const ids = [];
  while (ids.length < n) {
    const id = `MT-${String(k++).padStart(4, "0")}`;
    if (!used.has(id)) ids.push(id);
  }
  output({ ids: ids.join(" ") });
} else if (cmd === "script-check") {
  if (!existsSync(SCRIPT_RESULT)) die("mindtail-script.json missing: the script step did not finish");
  const r = readJson(SCRIPT_RESULT);
  if (r.status !== "ok") die(`the script step reported status "${r.status}": ${r.notes || "see mindtail-script-report.md"}`);
  const made = r.shorts || [];
  if (!made.length) die("mindtail-script.json lists no Shorts");
  const bad = [];
  for (const f of made) {
    if (!FOLDER.test(f) || !existsSync(join(series, f))) { bad.push(`${f}: no such folder in ${config.series}`); continue; }
    if (!scriptOf(f)) bad.push(`${f}: no *_script.md`);
    const vo = voiceoverOf(f);
    if (!vo) { bad.push(`${f}: no *_voiceover.txt`); continue; }
    const { words, problems } = voiceoverProblems(readFileSync(join(series, f, vo), "utf8"));
    for (const p of problems) bad.push(`${f}/${vo}: ${p}`);
    const secs = Math.round(words / config.wordsPerSecond);
    console.log(`${f}: ${words} words, about ${secs} s`);
  }
  if (bad.length) die(`script check failed:\n  - ${bad.join("\n  - ")}`);
  output({ shorts: made.join(" "), count: made.length });
} else if (cmd === "ready") {
  const max = Math.max(1, Number(flags.max) || config.editBatch || 1);
  let pick;
  if (arg) {
    const f = folders().find((n) => n.toLowerCase() === arg.toLowerCase() || idOf(n) === arg.toUpperCase());
    if (!f) die(`no Short ${arg} in ${config.series} (did the Drive pull run?)`);
    const audios = audiosOf(f);
    if (audios.length !== 1) die(`${f} has ${audios.length} audio files; it needs exactly one`);
    pick = [f];
  } else {
    pick = folders().filter((f) => stageOf(f) === "ready-to-edit").slice(0, max);
    const multi = folders().filter((f) => stageOf(f) === "several-audio-files");
    if (multi.length) console.error(`skipped (more than one audio file): ${multi.join(", ")}`);
  }
  output({ shorts: pick.join(" "), count: pick.length });
} else if (cmd === "info") {
  // one Short's paths, for the edit prompt
  const f = arg || die("usage: info <folder>");
  const brief = join(series, f, "brief.txt");
  output({
    short: f,
    id: idOf(f),
    audio: rel(config.series, f, audiosOf(f)[0] || ""),
    voiceover: voiceoverOf(f) ? rel(config.series, f, voiceoverOf(f)) : "",
    script: scriptOf(f) ? rel(config.series, f, scriptOf(f)) : "",
    brief: existsSync(brief) ? readFileSync(brief, "utf8").trim().replace(/\s+/g, " ") : "",
  });
} else if (cmd === "check") {
  const f = arg || die("usage: check <folder>");
  if (!existsSync(RUN_RESULT)) die("mindtail-run.json missing: the edit did not finish");
  const r = readJson(RUN_RESULT);
  if (r.short !== f) die(`mindtail-run.json is for ${r.short}, not ${f}`);
  if (r.status !== "ok") die(`the edit reported status "${r.status}": ${r.notes || "see mindtail-report.md"}`);
  const out = join(PROJECTS, r.project || "", "output");
  if (!r.project || !existsSync(join(out, "final-9x16.mp4"))) die(`no output/final-9x16.mp4 in projects/${r.project}`);
  if (!existsSync(join(out, "metadata.md"))) die(`no output/metadata.md in projects/${r.project}`);
  const v = run(process.execPath, [join(ROOT, "tools", "verify.mjs"), r.project, "--no-frames"], { allowFail: true });
  process.stdout.write(v.stdout);
  if (v.status !== 0 || !/structure ok/.test(v.stdout)) die("verify did not pass");
  output({ project: r.project });
} else if (cmd === "done") {
  const f = arg || die("usage: done <folder>");
  const r = readJson(RUN_RESULT);
  state.done = state.done.filter((d) => d.short !== f);
  state.done.push({ short: f, project: r.project, at: new Date().toISOString() });
  mkdirSync(join(ROOT, "config"), { recursive: true });
  writeJson(STATE, state);
  console.log(`${f} → done (config/mindtail-state.json)`);
} else die("usage: node tools/mindtail.mjs status | next-ids [n] | script-check | ready [MT-0001] [--max n] | info <folder> | check <folder> | done <folder>");
