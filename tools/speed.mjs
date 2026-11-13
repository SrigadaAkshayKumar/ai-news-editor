#!/usr/bin/env node
// A faster copy of a finished video: picture and audio sped up together, so captions, cuts and SFX stay in sync;
// atempo keeps the voice's pitch. Loudness is unchanged (same samples, shorter).
// Usage: node tools/speed.mjs <final.mp4> <factor 1.02-2.0>   → <final>-fast-<factor>x.mp4 next to it
import { existsSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { die, probe, run } from "./lib/common.mjs";

const [file, raw] = process.argv.slice(2);
const k = Number(raw);
if (!file || !existsSync(file)) die("usage: node tools/speed.mjs <final.mp4> <factor>");
if (!(k >= 1.02 && k <= 2)) die(`speed factor must be between 1.02 and 2.0, got ${raw}`);
const info = probe(file);
const out = join(dirname(file), `${basename(file, extname(file))}-fast-${k}x.mp4`);
run("ffmpeg", ["-y", "-v", "error", "-i", file,
  "-filter_complex", `[0:v]setpts=PTS/${k}[v];[0:a]atempo=${k}[a]`, "-map", "[v]", "-map", "[a]",
  "-r", String(info.fps || 30), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", out]);
const d0 = info.duration, d1 = probe(out).duration;
console.log(`${basename(out)}: ${d0.toFixed(1)}s → ${d1.toFixed(1)}s (${k}x)`);
