# MINDTAIL on this engine (branch `mindtail`)

This branch adapts the ai-news-editor engine for **MINDTAIL** (@MIND_TAIL_99): faceless Hindi/Hinglish
**YouTube Shorts only**, built from real stock B-roll, Remotion motion graphics, Hindi captions and careful
music + SFX mixing. `main` stays the 24 Hours in Tech news pipeline; nothing here changes it.

| File | What it is |
|---|---|
| `MINDTAIL_BLUEPRINT.md` | The original brief. Superseded where the decisions below differ. |
| `brand-guidelines.md` | Brand rules (palette, text, sound, content rules) |
| `backlog.md` | Example ideas only, none researched yet |

## Decisions so far (2026-11-13)

| Topic | Decision |
|---|---|
| Format | Shorts only, native 9:16 (no long-form, no clipping from 16:9) |
| Content | General youth content: shocking-but-true and mind-blowing facts, mind/psychology, stories & mysteries, motivation, modern life & social media, relatable youth topics |
| Tagline | None |
| Engine | This repo (Remotion + HyperFrames + ffmpeg mix + verify), on branch `mindtail` |
| Footage | Pexels, falling back to Pixabay (existing `tools/broll.mjs`) |
| Music / SFX | CC0 / YouTube-safe sources (existing `tools/bgm.mjs`, `tools/sfx.mjs`) |
| Voice | Hindi AI voiceover. Qwen3-TTS (used by the news channel) does not support Hindi, so ElevenLabs is the candidate; its timestamped TTS can supply word timings for captions. Plan and fallback still open. |

The earlier standalone ffmpeg prototype lives in the `SrigadaAkshayKumar/mindtail` repo and is retired in
favour of this engine.

## Must change before any MINDTAIL run (not done yet)

- **YouTube login**: the `YT_*` secrets upload to the 24 Hours in Tech channel. MINDTAIL needs its own
  login (separate secrets, or a GitHub environment) before any upload step is enabled on this branch.
- **Drive folder**: `RCLONE_CONF` / `config/daily.json` point at the `AI-News` Drive folder. MINDTAIL needs
  its own folder so news and MINDTAIL media never mix.
- **Brand profile**: add `config/brands/mindtail.json`; the news profile stays as is.
- **Schedule**: scheduled workflows only run from `main`, so nothing runs for MINDTAIL until a manual
  dispatch on this branch (or a MINDTAIL-specific workflow) is set up.
- **Voice**: replace the Qwen3-TTS step with the chosen Hindi voice, with a hard credit check before generating.
- **Licences**: ElevenLabs' free plan is non-commercial and requires attribution; a monetised channel needs
  a plan with commercial rights.

## Still open

Voice provider and fallback, MINDTAIL Remotion style (new, or based on glass/broadcast/liquid/blueprint),
cadence and upload slot, logo/banner without tagline.
