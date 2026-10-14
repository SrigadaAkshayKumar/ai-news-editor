#!/usr/bin/env node
// The channel's image library for thumbnails: company LOGOS and cut-out PEOPLE (CEOs, founders, ministers), fetched
// once from Wikimedia Commons / Wikidata, checked once, then reused every day. It lives in inbox/library/, which the
// daily workflow pulls from Google Drive and pushes back after the run: never in git (the repo is public, and these
// are other people's trademarks and photos — editorial use only, never altered beyond a background cut-out).
//   list                                   what the library holds (slug, kind, name, licence)
//   search logo "OpenAI"                   up to 6 Commons logo candidates  → inbox/library/_candidates/sheet.png
//   search person "Sam Altman"             Wikidata's portrait + Commons photos (free licences only) → same sheet
//                                          (Read the sheet: the CURRENT official logo / a clear, recent, front-on face)
//   pick <n> [--name openai]               keeps candidate n: a logo is copied as is; a person is cut out of the
//                                          background (HyperFrames' local remover) → inbox/library/{logos,people}/
//   use <project> <slug> [<slug> …]        copies entries into the project's assets/library/ and adds their credits to
//                                          work/credits.json (they go in the video description)
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { HYPERFRAMES_VERSION, ROOT, addCredit, die, npx, openProject, parseCli, readJson, run, slugify, writeJson } from "./lib/common.mjs";

const UA = "ai-news-editor-thumbnails/1.0 (https://github.com/SrigadaAkshayKumar/ai-news-editor)";
const COMMONS = "https://commons.wikimedia.org/w/api.php";
const WIKIDATA = "https://www.wikidata.org/w/api.php";
const LIB = join(ROOT, "inbox", "library");
const INDEX = join(LIB, "library.json");
const CAND = join(LIB, "_candidates");
// Commons hosts free files only, but check anyway: these are the licences a thumbnail may use (with attribution)
const FREE = /^(cc0|public domain|pd\b|pd-|cc[ -]by(-sa)?[ -]\d|cc[ -]by(-sa)?$)/i;

const { positional, flags } = parseCli();
const [cmd, a1, a2] = positional;
const index = existsSync(INDEX) ? readJson(INDEX) : {};
const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function api(base, params) {
  const r = await fetch(`${base}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`, { headers: { "User-Agent": UA } });
  if (!r.ok) die(`${base} ${r.status}`);
  return r.json();
}

/** Wikidata's own portrait (P18) for a person: usually the best, most current, free photo. */
async function wikidataPortrait(name) {
  const s = await api(WIKIDATA, { action: "wbsearchentities", search: name, language: "en", type: "item", limit: "3" });
  for (const hit of s.search || []) {
    const e = await api(WIKIDATA, { action: "wbgetentities", ids: hit.id, props: "claims" });
    const claims = e.entities?.[hit.id]?.claims || {};
    const human = (claims.P31 || []).some((c) => c.mainsnak?.datavalue?.value?.id === "Q5");
    const file = claims.P18?.[0]?.mainsnak?.datavalue?.value;
    if (human && file) return { title: `File:${file}`, qid: hit.id, description: hit.description || "" };
  }
  return null;
}

async function searchTitles(kind, name) {
  const titles = [];
  if (kind === "person") {
    const p = await wikidataPortrait(name);
    if (p) titles.push(p.title);
    const surname = name.split(/\s+/).at(-1).toLowerCase();
    const s = await api(COMMONS, { action: "query", list: "search", srsearch: `"${name}" filetype:bitmap`, srnamespace: "6", srlimit: "20" });
    for (const h of s.query?.search || []) {
      if (titles.length >= 6) break;
      if (!titles.includes(h.title) && h.title.toLowerCase().includes(surname) && /\.(jpe?g|png|webp)$/i.test(h.title)) titles.push(h.title);
    }
  } else {
    for (const q of [`${name} logo filetype:drawing`, `${name} logo`]) {
      const s = await api(COMMONS, { action: "query", list: "search", srsearch: q, srnamespace: "6", srlimit: "10" });
      for (const h of s.query?.search || []) if (!titles.includes(h.title) && /logo/i.test(h.title) && /\.(svg|png)$/i.test(h.title)) titles.push(h.title);
      if (titles.length >= 6) break;
    }
  }
  return titles.slice(0, 6);
}

function contactSheet(list, kind) {
  const cell = (c) => `<div class="c"><b>${c.n}</b>${kind === "logo"
    ? `<div class="w"><img src="${pathToFileURL(c.file)}"></div><div class="d"><img src="${pathToFileURL(c.file)}"></div>`
    : `<div class="p"><img src="${pathToFileURL(c.file)}"></div>`}<small>${c.title.replace(/^File:/, "").slice(0, 52)} · ${c.date} · ${c.license}</small></div>`;
  const html = `<!doctype html><meta charset=utf-8><style>body{margin:0;width:1200px;background:#ddd;font:13px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px}
.c{background:#fff;padding:8px}.c b{font-size:22px}.w,.d{height:110px;display:flex;align-items:center;justify-content:center;margin:4px 0}.d{background:#0b0d12}
.p{height:260px;display:flex;align-items:center;justify-content:center;background:#222;margin:4px 0}.p img{max-height:250px;max-width:95%}
.w img,.d img{max-width:85%;max-height:90px}</style>${list.map(cell).join("")}`;
  const tmp = join(tmpdir(), `library-${Date.now()}.html`);
  writeFileSync(tmp, html);
  const chrome = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/chromium", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find((p) => p && existsSync(p));
  if (chrome) {
    const h = kind === "logo" ? 700 : 760;
    const shot = join(CAND, "sheet-full.png");
    run(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", "--virtual-time-budget=4000", `--window-size=1216,${h + 200}`, `--screenshot=${shot}`, pathToFileURL(tmp).href]);
    run("ffmpeg", ["-y", "-v", "error", "-i", shot, "-vf", `crop=1216:${h}:0:0`, join(CAND, "sheet.png")]);
  }
  rmSync(tmp, { force: true });
}

if (cmd === "list") {
  const rows = Object.entries(index);
  if (!rows.length) console.log("library is empty (inbox/library/library.json)");
  for (const [slug, e] of rows) console.log(`${e.kind.padEnd(6)} ${slug.padEnd(22)} ${e.name.padEnd(24)} ${e.license}`);
} else if (cmd === "search") {
  const kind = a1;
  const name = a2;
  if (!["logo", "person"].includes(kind) || !name) die('usage: library.mjs search logo|person "Name"');
  rmSync(CAND, { recursive: true, force: true });
  mkdirSync(CAND, { recursive: true });
  const titles = await searchTitles(kind, name);
  if (!titles.length) die(`nothing found for "${name}" — leave it off the thumbnail`);
  const info = await api(COMMONS, { action: "query", titles: titles.join("|"), prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1200" });
  const pages = (info.query?.pages || []).sort((x, y) => titles.indexOf(x.title) - titles.indexOf(y.title));
  const list = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const m = ii.extmetadata || {};
    const license = strip(m.LicenseShortName?.value) || "unknown";
    if (!FREE.test(license)) { console.log(`skip ${p.title}: licence "${license}"`); continue; }
    // logos: the original (SVG stays vector); photos: a 1200 px rendition, plenty for a 540 px tall cut-out
    const url = kind === "logo" ? ii.url : ii.thumburl || ii.url;
    const n = list.length + 1;
    const file = join(CAND, `${n}${extname(new URL(url).pathname).toLowerCase() || ".jpg"}`);
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) continue;
    writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    list.push({ n, kind, name, file, title: p.title, page: ii.descriptionurl, license, author: strip(m.Artist?.value).slice(0, 120),
      date: strip(m.DateTimeOriginal?.value || m.DateTime?.value).slice(0, 10) });
  }
  if (!list.length) die(`no freely licensed image for "${name}" — leave it off the thumbnail`);
  writeJson(join(CAND, "candidates.json"), list);
  contactSheet(list, kind);
  for (const c of list) console.log(`${c.n}  ${c.title}  (${c.date}, ${c.license}${c.author ? `, ${c.author}` : ""})`);
  console.log(`contact sheet → ${join(CAND, "sheet.png")}  (Read it, then: library.mjs pick <n> --name ${slugify(name)})`);
} else if (cmd === "pick") {
  const list = existsSync(join(CAND, "candidates.json")) ? readJson(join(CAND, "candidates.json")) : die("run search first");
  const c = list.find((x) => x.n === Number(a1)) || die(`no candidate ${a1}`);
  const slug = slugify(flags.name || c.name);
  const sub = c.kind === "logo" ? "logos" : "people";
  mkdirSync(join(LIB, sub), { recursive: true });
  let rel;
  if (c.kind === "logo") {
    rel = `${sub}/${slug}${extname(c.file)}`;
    copyFileSync(c.file, join(LIB, rel));
  } else {
    rel = `${sub}/${slug}.png`;
    npx(["--yes", `hyperframes@${HYPERFRAMES_VERSION}`, "remove-background", c.file, "-o", join(LIB, rel)], { inherit: true });
    if (!existsSync(join(LIB, rel))) die("the background remover made no file");
  }
  index[slug] = { kind: c.kind, name: c.name, file: rel, title: c.title, source: c.page, license: c.license, author: c.author,
    added: new Date().toISOString().slice(0, 10) };
  writeJson(INDEX, index);
  console.log(`→ inbox/library/${rel}  (Read it${c.kind === "person" ? ": hair and shoulders cut cleanly, nothing of the old background left?" : ""})`);
} else if (cmd === "use") {
  const project = openProject(a1 || die("usage: library.mjs use <project> <slug> [<slug> …]"));
  const slugs = positional.slice(2);
  if (!slugs.length) die("name at least one slug (library.mjs list)");
  mkdirSync(join(project.dir, "assets", "library"), { recursive: true });
  for (const slug of slugs) {
    const e = index[slug] || die(`${slug} is not in the library — search + pick it first`);
    const rel = `assets/library/${e.file.split("/").pop()}`;
    copyFileSync(join(LIB, e.file), join(project.dir, rel));
    addCredit(join(project.paths.work, "credits.json"), { file: rel, title: e.title, source: e.source, license: e.license,
      author: e.author, note: e.kind === "logo" ? "trademark of its owner; editorial use" : "photo of a public figure; editorial use, background removed" });
    console.log(`${slug} → ${rel}`);
  }
} else die('usage: library.mjs list | search logo|person "Name" | pick <n> [--name slug] | use <project> <slug>…');
