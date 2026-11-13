#!/usr/bin/env node
// Look variants of a FINISHED edit, for choosing a template: the same cut, scenes, footage, overlays, timing and
// sound mix, re-rendered with another visual style and caption style. Only the picture passes run again
// (Remotion visuals, captions, finalize); transcription, cut, plans and the mix are reused untouched.
//
// Usage: node tools/variants.mjs <project> --looks "B:broadcast:karaoke:#ffd700,C:glass:clean:#ffffff" [--format 9:16]
//   each look = <label>:<visual style>:<caption style pop|clean|karaoke>:<caption accent>
// Writes output/variants/final-<fmt>-<label>-<style>.mp4 (+ a copy of the current final as label A when --a-label
// is given) and output/variants/README.md. The project's own style/caption settings and output/final-*.mp4 are
// restored afterwards, so a later re-render produces the main look again.
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { die, openProject, parseCli, readJson, run, selectFormats, writeJson } from "./lib/common.mjs";

const { flags, positional } = parseCli();
const project = openProject(positional[0]);
const { paths, data } = project;
const STYLES = ["glass", "broadcast", "liquid", "blueprint", "cleantech"];
const CAPTIONS = ["pop", "clean", "karaoke"];

const looks = String(flags.looks || "").split(",").filter(Boolean).map((s) => {
  const [label, style, caption, accent] = s.split(":");
  if (!label || !STYLES.includes(style)) die(`bad look "${s}": <label>:<${STYLES.join("|")}>:<${CAPTIONS.join("|")}>:<#accent>`);
  if (caption && !CAPTIONS.includes(caption)) die(`bad caption style in "${s}" (${CAPTIONS.join("|")})`);
  return { label, style, caption: caption || "pop", accent: accent || "#FFD400" };
});
if (!looks.length) die('usage: node tools/variants.mjs <project> --looks "B:broadcast:karaoke:#ffd700,…"');
if (!existsSync(paths.visualPlan)) die("work/visual-plan.json missing: finish the edit first");
const fmts = selectFormats(project, flags.format);
for (const f of fmts) if (!existsSync(join(paths.output, `final-${f.key}.mp4`))) die(`output/final-${f.key}.mp4 missing: finalize the edit first`);

const node = (tool, args) => run(process.execPath, [join(import.meta.dirname, tool), data.name, ...args], { inherit: true });
const fmtArgs = flags.format ? ["--format", String(flags.format)] : [];
const outDir = join(paths.output, "variants");
mkdirSync(outDir, { recursive: true });

// keep the main look so it can be restored
const planText = readFileSync(paths.visualPlan, "utf8");
const mainStyle = readJson(paths.visualPlan).style || data.style || "glass";
const mainCaptions = { ...(data.captions || {}) };
const mains = fmts.map((f) => {
  const file = join(paths.output, `final-${f.key}.mp4`);
  const keep = join(outDir, `.main-${f.key}.mp4`);
  copyFileSync(file, keep);
  return { file, keep, key: f.key };
});

const made = [];
if (flags["a-label"]) {
  for (const m of mains) {
    const name = `final-${m.key}-${flags["a-label"]}-${mainStyle}.mp4`;
    copyFileSync(m.keep, join(outDir, name));
    made.push({ label: String(flags["a-label"]), style: mainStyle, caption: mainCaptions.style || "pop", accent: mainCaptions.accent || "", file: name });
  }
}

try {
  for (const look of looks) {
    console.log(`\n=== look ${look.label}: style ${look.style}, captions ${look.caption} ${look.accent}`);
    const plan = JSON.parse(planText);
    plan.style = look.style;
    writeJson(paths.visualPlan, plan);
    node("render-visuals.mjs", fmtArgs);
    node("captions.mjs", [...fmtArgs, "--style", look.caption, "--accent", look.accent]);
    node("scaffold-edit.mjs", fmtArgs);
    node("finalize.mjs", fmtArgs);
    for (const m of mains) {
      const name = `final-${m.key}-${look.label}-${look.style}.mp4`;
      renameSync(m.file, join(outDir, name));
      made.push({ ...look, file: name });
    }
  }
} finally {
  // restore the main look: plan, caption settings, final files
  writeFileSync(paths.visualPlan, planText);
  const fresh = openProject(data.name);
  fresh.data.captions = mainCaptions;
  fresh.save();
  for (const m of mains) copyFileSync(m.keep, m.file);
}
if (mainCaptions.style) node("captions.mjs", [...fmtArgs, "--style", mainCaptions.style, ...(mainCaptions.accent ? ["--accent", mainCaptions.accent] : [])]);

const lines = ["# Look variants", "", "Same cut, footage, timing and sound; only the visual style and captions differ.", "",
  "| Label | Visual style | Captions | Accent | File |", "|---|---|---|---|---|",
  ...made.map((m) => `| ${m.label} | ${m.style} | ${m.caption} | ${m.accent} | ${m.file} |`), ""];
writeFileSync(join(outDir, "README.md"), lines.join("\n"));
console.log(`\n${made.length} variant file(s) in ${outDir}`);
