#!/usr/bin/env node
// Designed thumbnails: HTML/CSS templates rendered by headless Chrome: a colour-graded background (or a Gemini photo
// scene, graded the same way), set type and the extras below. See the youtube-thumbnail skill, section 5b.
// Usage:
//   node tools/thumb-design.mjs <project> <spec.json>      → projects/<p>/output/thumbnails/<name>.png + <name>-feed.png
//   node tools/thumb-design.mjs --demo <out-dir>           → one of each template with sample text
// spec.json: {"accent": "#00d1ff", "brand": "CHANNEL NAME", "variants": [
//   {"name": "A", "template": "roundup", "tag": "Official", "lines": ["Nvidia's", "*$5 trillion*", "day"],
//    "people": ["assets/library/jensen-huang.png"], "logos": ["assets/library/nvidia.svg"],
//    "stat": {"value": "+6%", "trend": "up"}, "bg": "assets/stills/thumb-bg.jpg"},
//   {"name": "A", "template": "headline", "kicker": "4 reasons · 2026", "lines": ["Selected.", "*Not* joined."]},
//   {"name": "B", "template": "stat", "kicker": "Cognizant", "number": "25,000", "caption": "hired. Still waiting?", "trend": "down"},
//   {"name": "C", "template": "versus", "kicker": "Freshers 2026", "left": {"label": "Selected", "value": "YES"},
//                                                                    "right": {"label": "Joining date", "value": "?"}}]}
// In `lines`, *word* marks the one highlighted word (accent box); in roundup, ^word^ sets a word in the second colour
// (`accent2`, default yellow) a size bigger. Optional on any variant (paths relative to the project):
//   "logo": "assets/logos/cognizant.svg"   company logo on a white plate, top right (tools/logo.mjs fetches it)
//   "badge": "Must watch"                  a small stamp next to the logo
//   "person": "work/thumb/cutout.png"      a cut-out person on the right third (headline / stat only); the text
//                                          narrows to make room (tools/thumbnail.mjs cutout makes the PNG)
//   "scene": "work/thumb/ai/A-1.png"       a full-bleed photo (tools/gemini-image.mjs) graded dark on the left for
//                                          the type; the subject stays on the right third (headline / stat)
// roundup (the daily news template): on the left an optional `tag` pill, the hook `lines`, an accent bar and up to 4
// `logos` on white plates; on the right 1-4 cut-out `people` (most important first: big, in front of an accent halo and
// ring; each with a white outline; tools/library.mjs supplies people and logos); an optional `stat` chip
// {value, trend: up|down} between the two; over an optional `bg` photo (darkened and tinted), else a tech grid.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { PROJECTS, ROOT, die, parseCli, readJson, run } from "./lib/common.mjs";

const { positional, flags } = parseCli();
const W = 1280;
const H = 720;
const FONTS = join(ROOT, "assets", "fonts");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// *word* → the accent highlight box; ^word^ → the second colour, a size up (roundup)
const marked = (s) => esc(s).replace(/\*([^*]+)\*/g, '<span class="hl">$1</span>').replace(/\^([^^]+)\^/g, '<span class="hl2">$1</span>');

function findChrome() {
  const c = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium",
    "/usr/bin/chromium-browser", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    join(process.env["ProgramFiles"] || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe")];
  return c.find((p) => p && existsSync(p)) || die("no Chrome found (set CHROME_PATH)");
}

/** Shared look: one dark base, the accent as light, its cool shadow, fine grain, vignette. Nothing else. */
function page(accent, body, brand) {
  const font = (name, file) => `@font-face{font-family:"${name}";src:url("${pathToFileURL(join(FONTS, file))}") format("woff2");}`;
  const grain = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${font("Display", "InterDisplay-Black.woff2")}${font("DisplayXB", "InterDisplay-ExtraBold.woff2")}${font("UI", "Inter-SemiBold.woff2")}${font("UIB", "Inter-Bold.woff2")}
:root{--a:${accent};--a2:#ffd60a;--ink:#f4f1ea;--dim:rgba(244,241,234,.55);--bg:#0b0d12}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:var(--bg)}
.frame{position:relative;width:${W}px;height:${H}px;overflow:hidden;font-family:UI;color:var(--ink);
  background:
    radial-gradient(900px 620px at 88% 18%, color-mix(in srgb,var(--a) 34%,transparent), transparent 62%),
    radial-gradient(700px 520px at 6% 105%, color-mix(in srgb,var(--a) 10%,#0f1a2b 90%), transparent 70%),
    linear-gradient(160deg,#121621 0%,#0b0d12 55%,#08090d 100%)}
.frame::before{content:"";position:absolute;inset:0;z-index:1;background:url("data:image/svg+xml,${grain}");opacity:.07;mix-blend-mode:overlay;pointer-events:none}
.frame::after{content:"";position:absolute;inset:0;z-index:1;box-shadow:inset 0 0 220px 40px rgba(0,0,0,.65);pointer-events:none}
.kicker{position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:14px;font-family:UIB;font-size:26px;
  letter-spacing:.16em;text-transform:uppercase;color:var(--ink);opacity:.92}
.kicker i{width:12px;height:12px;border-radius:50%;background:var(--a);box-shadow:0 0 18px var(--a)}
.brand{position:absolute;left:72px;bottom:58px;display:flex;align-items:center;gap:12px;font-family:UIB;font-size:22px;
  letter-spacing:.22em;color:var(--dim)}
.brand b{width:28px;height:4px;background:var(--a);display:block}
.hl{color:var(--a)}
/* headline */
.headline{position:absolute;left:68px;right:120px;top:50%;transform:translateY(-46%)}
.headline div{font-family:Display;font-size:var(--fs);line-height:1.02;letter-spacing:-.045em;text-transform:uppercase;
  text-shadow:0 18px 60px rgba(0,0,0,.55)}
.headline .hl{color:var(--bg);background:var(--a);padding:0 .12em;margin:0 -.04em;border-radius:.06em;
  box-shadow:0 0 60px color-mix(in srgb,var(--a) 45%,transparent);text-shadow:none}
/* stat */
.stat{position:absolute;left:66px;top:50%;transform:translateY(-50%)}
.num{display:inline-block;padding-right:.1em;font-family:Display;font-size:var(--fs);line-height:.86;letter-spacing:-.055em;
  background:linear-gradient(180deg,#fff 0%,#fff 45%,color-mix(in srgb,var(--a) 85%,#fff) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 20px 50px rgba(0,0,0,.5))}
.cap{margin-top:22px;font-family:UIB;font-size:46px;line-height:1.08;letter-spacing:-.01em;max-width:760px}
.trend{position:absolute;right:40px;bottom:150px;width:440px;height:260px;opacity:.9}
/* versus */
.vs{position:absolute;left:0;right:0;top:150px;bottom:130px;display:grid;grid-template-columns:1fr 1fr}
.side{display:flex;flex-direction:column;justify-content:center;padding:0 60px 0 72px}
.side + .side{padding:0 72px 0 72px;border-left:2px solid rgba(244,241,234,.12)}
.lab{font-family:UIB;font-size:34px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.val{font-family:Display;font-size:var(--fs);line-height:.9;letter-spacing:-.05em;text-transform:uppercase;margin-top:10px}
.side.l .val{color:rgba(244,241,234,.92)}
.side.r .val{color:var(--a);text-shadow:0 0 70px color-mix(in srgb,var(--a) 40%,transparent)}
.side.r .lab{color:var(--ink)}
/* extras */
.tr{position:absolute;right:64px;top:52px;display:flex;align-items:center;gap:22px;z-index:3}
.plate{background:#fff;border-radius:16px;padding:14px 22px;box-shadow:0 14px 40px rgba(0,0,0,.45);display:flex;align-items:center}
.plate img{height:52px;max-width:240px;object-fit:contain;display:block}
.badge{font-family:UIB;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:var(--a);padding:10px 18px;
  border:3px solid var(--a);border-radius:10px;transform:rotate(-4deg);background:rgba(11,13,18,.55);
  box-shadow:0 0 30px color-mix(in srgb,var(--a) 30%,transparent),inset 0 0 18px color-mix(in srgb,var(--a) 18%,transparent)}
.person{position:absolute;right:10px;bottom:0;height:540px;z-index:1;
  filter:drop-shadow(-14px 0 26px color-mix(in srgb,var(--a) 35%,transparent)) drop-shadow(0 30px 40px rgba(0,0,0,.6))}
.person-fade{position:absolute;right:0;bottom:0;width:640px;height:200px;z-index:1;background:linear-gradient(0deg,rgba(8,9,13,.85),transparent)}
/* roundup: photo or tech-grid background, accent halo, 1-4 outlined people, hook + tag + logo row, stat chip */
.ru{position:absolute;left:64px;top:50%;transform:translateY(-54%);width:560px;z-index:4}
/* each line sized on its own (short lines bigger), then shrunk in the page until it fits the column; real word gaps */
.ru .l{width:max-content;white-space:nowrap;font-family:Display;font-size:var(--fs);line-height:1.04;letter-spacing:-.035em;
  word-spacing:.2em;text-transform:uppercase;
  text-shadow:0 6px 0 rgba(0,0,0,.55),0 18px 60px rgba(0,0,0,.7)}
.ru .l .hl2{color:var(--a2);font-size:1.18em;line-height:.9;text-shadow:0 6px 0 rgba(0,0,0,.55),0 0 40px color-mix(in srgb,var(--a2) 35%,transparent)}
.ru .l .hl{color:#fff;background:var(--a);padding:0 .12em;margin:0 .02em;border-radius:.06em;text-shadow:0 3px 0 rgba(0,0,0,.25);
  box-shadow:0 0 60px color-mix(in srgb,var(--a) 55%,transparent)}
.tag{display:inline-flex;align-items:center;gap:12px;margin-bottom:20px;font-family:UIB;font-size:28px;letter-spacing:.14em;
  text-transform:uppercase;color:#fff;background:var(--a);padding:8px 18px 8px 14px;border-radius:8px;transform:rotate(-2deg);
  box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 40px color-mix(in srgb,var(--a) 45%,transparent)}
.tag i{width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 0 0 5px rgba(255,255,255,.28)}
.bar{width:150px;height:8px;margin-top:24px;border-radius:4px;background:linear-gradient(90deg,var(--a),transparent)}
.ru .logos{position:static;display:flex;gap:12px;margin-top:22px;flex-wrap:nowrap}
.ru .logos .plate{padding:9px 14px;border-radius:12px;box-shadow:0 10px 26px rgba(0,0,0,.55)}
.ru .logos .plate img{height:var(--lh);max-width:var(--lw)}
.bgphoto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;filter:grayscale(.65) contrast(1.15) brightness(.62)}
.bgtint{position:absolute;inset:0;z-index:0;background:
  linear-gradient(90deg,rgba(8,9,13,.96) 0%,rgba(8,9,13,.86) 38%,rgba(8,9,13,.25) 66%,rgba(8,9,13,.1) 100%),
  linear-gradient(0deg,rgba(8,9,13,.8) 0%,transparent 35%),
  linear-gradient(200deg,color-mix(in srgb,var(--a) 38%,transparent) 0%,transparent 55%)}
.grid{position:absolute;left:-10%;right:-10%;bottom:-40px;height:330px;z-index:0;opacity:.32;transform:perspective(420px) rotateX(62deg);
  transform-origin:bottom;background:
    repeating-linear-gradient(90deg,color-mix(in srgb,var(--a) 70%,transparent) 0 2px,transparent 2px 64px),
    repeating-linear-gradient(0deg,color-mix(in srgb,var(--a) 70%,transparent) 0 2px,transparent 2px 64px);
  -webkit-mask-image:linear-gradient(0deg,#000 10%,transparent 90%);mask-image:linear-gradient(0deg,#000 10%,transparent 90%)}
.beam{position:absolute;top:-200px;width:120px;height:1200px;z-index:0;transform:rotate(24deg);opacity:.16;
  background:linear-gradient(90deg,transparent,var(--a),transparent)}
.halo{position:absolute;z-index:1;border-radius:50%;transform:translate(-50%,-50%);
  background:radial-gradient(circle,color-mix(in srgb,var(--a) 70%,transparent) 0%,color-mix(in srgb,var(--a) 22%,transparent) 42%,transparent 70%)}
.ring{position:absolute;z-index:1;border-radius:50%;transform:translate(-50%,-50%);border:4px solid color-mix(in srgb,var(--a) 85%,#fff);
  box-shadow:0 0 40px color-mix(in srgb,var(--a) 60%,transparent),inset 0 0 40px color-mix(in srgb,var(--a) 40%,transparent);opacity:.75}
.who{position:absolute;bottom:0;transform:translateX(-50%);object-fit:contain;object-position:bottom;
  /* a white sticker outline (four hard 0-blur shadows), then the accent glow and the drop shadow */
  filter:drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff)
    drop-shadow(-12px 0 24px color-mix(in srgb,var(--a) 35%,transparent)) drop-shadow(0 26px 36px rgba(0,0,0,.65))}
.who.back{filter:brightness(.82) drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff)
    drop-shadow(0 20px 30px rgba(0,0,0,.6))}
.floor{position:absolute;left:0;right:0;bottom:0;height:170px;z-index:3;background:linear-gradient(0deg,rgba(8,9,13,.92),transparent)}
.chip{position:absolute;z-index:5;display:flex;align-items:center;gap:12px;padding:10px 22px 12px;border-radius:16px;transform:rotate(-5deg);
  background:#fff;color:#0b0d12;font-family:Display;font-size:62px;line-height:1;letter-spacing:-.04em;
  box-shadow:0 18px 40px rgba(0,0,0,.55),0 0 0 5px var(--a)}
.chip svg{width:44px;height:44px}
.headline,.stat,.kicker,.vs{z-index:2}
.brand{z-index:6}
.scene{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;filter:saturate(.88) contrast(1.06)}
.scene-grade{position:absolute;inset:0;z-index:0;background:
  linear-gradient(90deg,rgba(8,9,13,.94) 0%,rgba(8,9,13,.82) 34%,rgba(8,9,13,.35) 58%,rgba(8,9,13,0) 76%),
  linear-gradient(0deg,rgba(8,9,13,.7) 0%,transparent 30%),
  radial-gradient(700px 500px at 85% 20%,color-mix(in srgb,var(--a) 22%,transparent),transparent 70%)}
.scene-grade.full{background:rgba(8,9,13,.78)}
</style></head><body><div class="frame">${body}${brand ? `<div class="brand"><b></b>${esc(brand)}</div>` : ""}</div></body></html>`;
}

/** Biggest size that keeps the longest line inside `width` px (Inter Display Black ≈ 0.62 em per uppercase char). */
const fit = (text, width, max, k = 0.62) => Math.round(Math.min(max, width / (Math.max(3, text.replace(/[*^]/g, "").length) * k)));

// the size estimate is rough: in the page, shrink each hook line until it fits the 560 px column, then the whole block
// until it fits the frame's height
const FIT = `<script>(()=>{const ls=[...document.querySelectorAll(".ru .l")];for(const l of ls){let f=parseFloat(l.style.fontSize);
while(l.offsetWidth>560&&f>36){f-=2;l.style.fontSize=f+"px"}}const ru=document.querySelector(".ru");let k=0;
while(ru.offsetHeight>620&&k++<30)for(const l of ls)l.style.fontSize=parseFloat(l.style.fontSize)*0.96+"px"})()</script>`;

function variantHtml(v, accent, brand, base) {
  const asset = (p) => {
    const abs = existsSync(p) ? p : join(base || ".", p);
    return existsSync(abs) ? pathToFileURL(abs).href : die(`${v.name}: not found: ${p}`);
  };
  const person = v.person && v.template !== "versus" ? `<img class="person" src="${asset(v.person)}"><div class="person-fade"></div>` : "";
  const scene = v.scene ? `<img class="scene" src="${asset(v.scene)}"><div class="scene-grade${v.template === "versus" ? " full" : ""}"></div>` : "";
  const narrow = person || (scene && v.template !== "versus");
  const textW = narrow ? 680 : 1060;
  const tr = v.logo || v.badge ? `<div class="tr">${v.badge ? `<div class="badge">${esc(v.badge)}</div>` : ""}${v.logo ? `<div class="plate"><img src="${asset(v.logo)}"></div>` : ""}</div>` : "";
  const kicker = scene + (v.kicker ? `<div class="kicker"><i></i>${esc(v.kicker)}</div>` : "") + tr + person;
  if (v.template === "headline") {
    const lines = v.lines || die(`${v.name}: headline needs "lines"`);
    const fs = Math.min(...lines.map((l) => fit(l, textW, 168)));
    return page(accent, `${kicker}<div class="headline" style="--fs:${fs}px">${lines.map((l) => `<div>${marked(l)}</div>`).join("")}</div>`, brand);
  }
  if (v.template === "stat") {
    const fs = fit(v.number || die(`${v.name}: stat needs "number"`), narrow ? 640 : 760, 280, 0.66);
    const down = v.trend !== "up";
    const pts = down ? "0,60 90,90 170,70 260,150 340,130 430,230 520,250 610,330" : "0,330 90,280 170,300 260,200 340,220 430,120 520,130 610,40";
    const end = down ? [610, 330] : [610, 40];
    const trend = v.trend && !narrow ? `<svg class="trend" viewBox="0 0 620 360"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${accent}" stop-opacity="0"/><stop offset="1" stop-color="${accent}" stop-opacity=".9"/></linearGradient></defs><polyline points="${pts}" fill="none" stroke="url(#g)" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${end[0]}" cy="${end[1]}" r="11" fill="${accent}"/><circle cx="${end[0]}" cy="${end[1]}" r="26" fill="${accent}" opacity=".18"/></svg>` : "";
    return page(accent, `${trend}${kicker}<div class="stat" style="--fs:${fs}px"><div class="num">${esc(v.number)}</div>${v.caption ? `<div class="cap" style="max-width:${narrow ? 620 : 760}px">${marked(v.caption)}</div>` : ""}</div>`, brand);
  }
  if (v.template === "versus") {
    const { left, right } = v;
    if (!left || !right) die(`${v.name}: versus needs "left" and "right"`);
    const fs = Math.min(fit(left.value, 520, 190), fit(right.value, 520, 190));
    const side = (s, cls) => `<div class="side ${cls}"><div class="lab">${esc(s.label)}</div><div class="val">${esc(s.value)}</div></div>`;
    return page(accent, `${kicker}<div class="vs" style="--fs:${fs}px">${side(left, "l")}${side(right, "r")}</div>`, brand);
  }
  if (v.template === "roundup") {
    const lines = v.lines || die(`${v.name}: roundup needs "lines"`);
    const people = (v.people || []).slice(0, 4);
    const logos = (v.logos || []).slice(0, 4);
    if (!people.length) console.warn(`${v.name}: roundup with no people: the daily thumbnail should have 1-4 (skill 5c)`);
    // a size per line, at most 1.6x the smallest so the hook still reads as one block
    const sizes = lines.map((l) => fit(l.replace(/\^([^^]+)\^/g, (m, w) => w + w.slice(0, Math.ceil(w.length * 0.2))), 540, 150, 0.6));
    const fs = Math.min(...sizes);
    // the cast: [centre x, height, lift] per person, most important first; the first is drawn in front, the rest
    // behind; a fourth stands raised in the gap between the lead and the left face so its face stays visible
    const SLOTS = [[], [[985, 690]], [[1040, 670], [800, 560]], [[975, 660], [780, 540], [1170, 540]],
      [[1010, 640], [735, 500], [1190, 500], [870, 420, 110]]][people.length];
    const [lx, lh] = SLOTS[0] || [985, 660];
    const halo = `<div class="halo" style="left:${lx}px;top:${H - lh * 0.72}px;width:${lh * 1.25}px;height:${lh * 1.25}px"></div>` +
      `<div class="ring" style="left:${lx}px;top:${H - lh * 0.72}px;width:${lh * 0.74}px;height:${lh * 0.74}px"></div>`;
    // back row first in the markup: the lead (index 0) ends up on top
    const order = people.map((p, i) => i).reverse();
    const cast = order.map((i) => `<img class="who${i ? " back" : ""}" src="${asset(people[i])}" style="left:${SLOTS[i][0]}px;bottom:${SLOTS[i][2] || 0}px;height:${SLOTS[i][1]}px;max-width:${Math.round(SLOTS[i][1] * 0.95)}px;z-index:${i ? 2 : 3}">`).join("");
    const bg = v.bg ? `<img class="bgphoto" src="${asset(v.bg)}"><div class="bgtint"></div>` : `<div class="beam" style="left:760px"></div><div class="beam" style="left:1010px;width:60px"></div><div class="grid"></div>`;
    const lhPx = logos.length > 3 ? 30 : 38;
    const plates = logos.length ? `<div class="logos" style="--lh:${lhPx}px;--lw:${logos.length > 3 ? 92 : 120}px">${logos.map((l) => `<div class="plate"><img src="${asset(l)}"></div>`).join("")}</div>` : "";
    const tag = v.tag ? `<div class="tag"><i></i>${esc(v.tag)}</div>` : "";
    const arrow = (up) => `<svg viewBox="0 0 40 40"><path d="${up ? "M20 4 36 26H26v10H14V26H4z" : "M20 36 36 14H26V4H14v10H4z"}" fill="${up ? "#18b26b" : accent}"/></svg>`;
    // the stat chip sits where the text column meets the cast, over the lead's shoulder line
    const chip = v.stat?.value ? `<div class="chip" style="left:${people.length > 2 ? 600 : 640}px;top:${people.length > 2 ? 520 : people.length ? 455 : 300}px">${v.stat.trend ? arrow(v.stat.trend === "up") : ""}${esc(v.stat.value)}</div>` : "";
    return page(accent, `${bg}${halo}${cast}<div class="floor"></div>${chip}<div class="ru" style="--fs:${fs}px${v.accent2 ? `;--a2:${v.accent2}` : ""}">${tag}${lines.map((l, i) => `<div class="l" style="font-size:${Math.min(sizes[i], Math.round(fs * 1.6))}px">${marked(l)}</div>`).join("")}<div class="bar"></div>${plates}</div>${FIT}`, brand);
  }
  die(`${v.name}: unknown template "${v.template}" (headline | stat | versus | roundup)`);
}

function render(html, out) {
  const dir = mkdtempSync(join(tmpdir(), "thumb-"));
  try {
    const file = join(dir, "t.html");
    writeFileSync(file, html);
    run(findChrome(), ["--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1",
      // headless Chrome's viewport is shorter than --window-size: shoot a taller window and crop the frame
      "--allow-file-access-from-files", "--virtual-time-budget=3000", `--window-size=${W},${H + 200}`, `--screenshot=${join(dir, "shot.png")}`, pathToFileURL(file).href]);
    if (!existsSync(join(dir, "shot.png"))) die(`Chrome made no screenshot for ${out}`);
    run("ffmpeg", ["-y", "-v", "error", "-i", join(dir, "shot.png"), "-vf", `crop=${W}:${H}:0:0`, out]);
    const feed = out.replace(/\.png$/, "-feed.png");
    run("ffmpeg", ["-y", "-v", "error", "-i", out, "-vf", "scale=214:-2", feed]);
    console.log(`${out}\n  feed-size preview → ${feed}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (flags.demo) {
  const outDir = typeof flags.demo === "string" ? flags.demo : "thumb-demo";
  mkdirSync(outDir, { recursive: true });
  const demo = [
    { name: "headline", template: "headline", kicker: "4 reasons · 2026", lines: ["Selected.", "*Not* joined."] },
    { name: "stat", template: "stat", kicker: "Cognizant · 2026", number: "25,000", caption: "freshers hired.<br>*Still waiting?*", trend: "down" },
    { name: "versus", template: "versus", kicker: "Freshers 2026", left: { label: "Selected", value: "Yes" }, right: { label: "Joining date", value: "?" } },
    { name: "roundup", template: "roundup", lines: ["Nvidia's", "*$5 trillion*", "day"] },
  ];
  for (const v of demo) render(variantHtml({ ...v, caption: v.caption?.replace("<br>", " ") }, "#00d1ff", "CHANNEL NAME"), join(outDir, `${v.name}.png`));
} else {
  const [project, specFile] = positional;
  if (!project || !specFile) die("usage: node tools/thumb-design.mjs <project> <spec.json> | --demo <out-dir>");
  const spec = readJson(existsSync(specFile) ? specFile : join(PROJECTS, project, specFile));
  const out = join(PROJECTS, project, "output", "thumbnails");
  mkdirSync(out, { recursive: true });
  for (const v of spec.variants || die("spec has no variants")) {
    render(variantHtml({ accent2: spec.accent2, ...v }, spec.accent || "#00d1ff", spec.brand ?? "", join(PROJECTS, project)), join(out, `${v.name}.png`));
  }
  writeFileSync(join(out, "spec.json"), readFileSync(existsSync(specFile) ? specFile : join(PROJECTS, project, specFile)));
}
