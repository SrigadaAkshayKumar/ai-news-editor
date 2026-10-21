---
name: daily-run
description: The UNATTENDED daily run in GitHub Actions — edit one daily tech news roundup (software, AI, hardware) end to end with nobody to ask, finalize and verify it, cut YouTube Shorts from it with AI-clipper, write the upload metadata, and leave daily-run.json + daily-report.md for the workflow to check and upload to Google Drive. Use only when the prompt says it is the daily run (or the user asks to rehearse it locally).
---

# Daily run (no human in the loop)

The workflow (`.github/workflows/daily-edit.yml`) has already: pulled the Drive inbox into `inbox/`, picked the
episode (`node tools/daily.mjs next`), installed everything, and written `.env`. Your prompt names the episode, its
voiceover and the brief. After you stop, the workflow runs `node tools/daily.mjs check` and uploads only if it passes.

## Ground rules

- **Nobody will answer a question.** Never ask; decide, and write the decision in `daily-report.md`.
  If something is genuinely impossible (no audio, unreadable script, a figure you cannot confirm), stop, write `daily-run.json` with `"status": "failed"` and the reason, and end.
- **Read `docs/lessons.md` first**, then `config/daily.json` (the standing brief). A non-empty brief in the prompt
  (from `brief.txt` in the episode's Drive folder, or typed when the run was started by hand) overrides it.
- This is a 2-CPU / 7 GB Linux runner, not the laptop. One render at a time; never run two renders in parallel.
  Renders take longer here than the laptop's estimates; that is fine (the job has ~5.5 h).
- Never generate or alter the voice. Never print `.env`.

## Standing rules (from the user; they live here because the cloud run has no memory of past sessions)

- **Music: none** unless the brief asks for BGM. When asked: CC0 only (`npm run bgm -- … --cc0`), never CC BY.
  Stock footage/photos from Pexels/Pixabay only.
- **SFX must be audible** — cues have to cut through the bed; check levels in `work/levels.json` after the mix.
- **News series** (`inbox/faceless/AI_News_Daily/dNN/`): `dNN_<slug>_voiceover.txt` = spoken words (TTS spelling),
  `dNN_<slug>_script.md` = scenes + **Screen** directions (follow them; they ARE the direction pass),
  `dNN_<slug>_stories.json` = the stories with their companies and people (thumbnail + metadata), audio = the media
  file in the folder. Create with
  `npm run new -- <audio-path> --mode faceless --brand ai-news --formats 16:9 --style <look's style> --no-captions --brief "<brief>; <look's brief>"`.
- **It is a roundup, not a documentary:** the structure is the story list. Every story change is a clear beat (story
  counter on the chapter rail, a wipe + hit SFX), every story shows its real source (news screenshot with
  `tools/news.mjs`, or a NewsCard naming outlet and date). Logos and people's photos are not used in the picture.
- **Edit look:** the prompt names this episode's look (`config/daily.json` → `looks`: one fixed newsroom look, so
  the channel is recognisable day to day). Its `--style` and its words (pacing, what leads
  the picture: graphics, news screenshots or b-roll; SFX character) are part of the brief — follow them through
  the visual plan and the SFX design, not just the theme. A brief override in the prompt wins where they clash.
  Name the look in `daily-report.md`.
- Numbers on screen come from the transcript and must match the sources list in the script; a figure that
  disagrees with its source is fixed on screen to the source (and noted), never invented.
- Component mapping: NewsCard → news scene (+keyword_chip source), StatCounter → number_roll/stat_trio,
  CompareChart → bar_chart, Timeline → timeline, FlowDiagram → flow_diagram, ChecklistPanel → checklist,
  QuoteCard → quote_pull, TipBadge/TrapBadge → side_note/keyword_chip, ChapterDots → chapter rail.
  CommentCard/EndScreen have no component: substitute (quote_pull / a closing card) and note it in the report.
- On-screen: something changes every 4–6 s, keywords only, "reported" for non-official claims, no real logos on
  fake/sample documents.

## Steps

0. **Existing project?** If `projects/` already has a project made from this episode's folder (work pushed from
   the laptop, or an earlier failed run), its `source/` media is not in git. Keep its `work/*.json` decisions
   aside, delete the folder, re-create it with `npm run new` (same audio, so the same name), restore the decisions
   that still apply (the `edl.json` / plans are valid only if the transcript matches), and carry on from there.
1. **Edit** with the `edit-video-faceless` skill, all stages, through `npm run finalize -- <p>` and
   `npm run verify -- <p>`. Read the verify sheet and the stills yourself; fix anything broken before moving on.
   `verify` must end with `structure ok`.
2. **Metadata**: `youtube-metadata` skill → `projects/<p>/output/metadata.md` (titles, description with chapters,
   tags, pinned comment). Then write the upload file `projects/<p>/output/youtube.json` following that skill's
   **upload copy** rules (SEO title 70-100 chars with ` | ` search phrases; no stock-footage credits; tags filling
   ~430-490 characters) — it is uploaded exactly as written, unseen:
   `{"title": "<SEO title, ≤ 100 chars>", "description": "<the full description: chapters, sources, hashtags>",
   "tags": ["…"], "thumbnail": "output/thumbnails/A.png"}`.
   **Title:** the brand's `titleFormula` (`config/brands/ai-news.json`): the fixed "What Happened in the Last 24
   Hours" phrase, today's date, and the 2–3 biggest names from `stories.json`.
   **Thumbnails:** before writing `youtube.json`, make the daily **roundup** thumbnail with the `youtube-thumbnail`
   skill, section 5c (a dramatic hook from today's script, no date, no kicker + the day's logos and 1–4 people from
   `inbox/library/`, fetched with `tools/library.mjs` when new — never a thumbnail without a face while 5c's fallback
   list still has someone; tag, stat chip and a stock photo background when they fit), and point `thumbnail` at `output/thumbnails/A.png`. Plain text, no
   markdown, no `<` or `>`. The Shorts go up from `clips.json` (their `title`, `description`, `hashtags`), the same
   day as the video; no "full video" link in their descriptions (the owner links the Related video in Studio).
3. **Shorts**: read `AI-clipper/.claude/skills/clip-shorts/SKILL.md` and follow it with the finished project:
   `npm run shorts:transcribe -- <p>` (clean source, no Whisper), write `AI-clipper/jobs/<p>/clips.json` (framing from
   `config/daily.json` → `shorts.framing`, the video's language), `npm run shorts:prepare -- <p>`,
   `npm run shorts:render -- <p>`. Spot-check frames of each clip. All of the skill's clip rules apply (natural
   length ≤ 70 s, no repeated footage, honest hooks, Instagram block on every clip).
4. **Report** — write both files at the repo root:
   - `daily-run.json`: `{"episode": "dNN", "project": "<p>", "shorts": "<p>", "status": "ok"|"failed", "notes": "…"}`
   - `daily-report.md`: what was made, every judgment call (cuts, substitutions, numbers checked and against what
     source), anything the user should look at or listen to before posting, and the Shorts table.
   Copy `daily-report.md` into `projects/<p>/output/` too, so it lands in Drive next to the video.

**Launch video** (run note says LAUNCH; `daily-script.json` has `"kind": "launch"`): edit it like an episode, ~60–80 s,
same newsroom look, the channel name and the daily time on screen at the end. **No Shorts** (skip step 3; leave
`"shorts"` out of `daily-run.json`). Thumbnail: the 5c template with a hook about the channel itself (e.g.
"Tech news, / *every day*") and the logos from `stories.json`, no people. `youtube.json`: a channel-trailer title
(e.g. "24 Hours in Tech: The Day's Tech News in Minutes | Software, AI & Hardware"), a description that says what the
channel posts and when (daily, 8:30 PM IST / 15:00 UTC), and channel keywords as tags. No chapters.

Do not commit, push or upload — the workflow does that after `check` passes.
