# Daily tech news roundup (software, AI, hardware): one-time setup

Every day at 08:17 IST, `.github/workflows/daily-edit.yml` runs on GitHub. It pulls the inbox from Google Drive and
makes today's episode:

1. **Script** (`daily-script` skill): Claude researches the tech and AI news of the last 24 hours, picks 6–10
   stories, checks every figure against its source, and writes the script, the voiceover text and
   `dNN_…_stories.json` (each story's companies and people, for the thumbnail).
2. **Voice** (`tools/voice/tts.py`): a built-in English male Qwen3-TTS speaker (`config/voice.json` → `speaker`,
   default `Aiden`, a clear American male voice that a global audience understands easily; the other
   English male is `Ryan`, more energetic) reads the voiceover on CPU. No voice cloning, no reference clip. About
   30–40 minutes for a 6 minute voiceover. Script and voice are saved to the episode's Drive folder.
3. **Edit** (`daily-run` skill): edit (newsroom look, story counter, real sources on screen), `verify`, the
   roundup thumbnail, Shorts, metadata. Everything goes to Drive.

This repo is a copy of `ai-video-editor` (the Crack IT channel) and runs completely separately: its own Drive
folder, secrets, schedule and YouTube channel. Media never goes into git: only code and the edit decision files
(`projects/<p>/work/*.json`, `config/daily-state.json`) are committed back.

## 1. Google Drive layout

Make one folder in your Drive, `AI-News` (a different folder from Crack IT's `AI-edits`):

```
AI-News/
  inbox/
    brand/Intro.mp4                         ← optional channel intro (used only if it exists)
    library/                                ← the thumbnail library: the run fills it, you can curate it
      library.json                          (every entry: source page, licence, author)
      logos/openai.svg  google.svg  …
      people/sam-altman.png  dario-amodei.png  …   (cut-outs)
    faceless/AI_News_Daily/                 ← the run creates one folder a day
      d01/  d01_ai_tech_news_14_oct_2026_script.md  …_voiceover.txt  …_stories.json  d01-voice.wav
  output/                                   ← the workflow writes here
    d01-ai-tech-news-14-oct-2026/
      final-16x9.mp4  credits.md  metadata.md  daily-report.md  thumbnails/A.png
      shorts/  01-….mp4  02-….mp4  UPLOAD_SHEET.md  clips.json
    _failed/…  _logs/…
```

- **The thumbnail** is the same design every day (`config/brands/ai-news.json` → `thumbnail`) with new words: a
  dramatic hook from the day's script (no fixed slogan, no date), and on the right the day's biggest companies (logos) and people (cut-out
  photos with a white outline; at least one well-known face whenever the day's stories allow). Logos and photos come from Wikimedia Commons / Wikidata with free licences only, via
  `tools/library.mjs`. Each one is fetched once and then reused. To seed the library yourself with the companies and people
  you expect every week, run locally with the Drive inbox synced:
  `node tools/library.mjs search person "Sam Altman"` → look at `inbox/library/_candidates/sheet.png` →
  `node tools/library.mjs pick 1 --name sam-altman`, then upload `inbox/library/` to Drive. Delete a file from
  Drive (and its `library.json` entry) to make the run fetch a better one.
- **A planned episode:** drop `dNN/dNN_<slug>_script.md` (same format) in the series folder and it is voiced and
  edited instead of a fresh roundup.
- `brief.txt` (optional, one line) in an episode folder overrides the standing style for that episode.
- A different Drive folder name: set the repository **variable** `DRIVE_ROOT`.

## 2. Drive access for the runner (rclone)

On your PC: install rclone (`winget install Rclone.Rclone`), run `rclone config`, then choose `n` (new remote),
name **`gdrive`**, storage **drive**, and leave client id/secret **empty**. Pick scope `drive`, then log in
through the browser. Same Google account as Crack IT? You can reuse Crack IT's `RCLONE_CONF` value as is.
Check it with `rclone lsd gdrive:AI-News`, then copy the whole `[gdrive]` section of
`%APPDATA%\rclone\rclone.conf` into the GitHub secret **`RCLONE_CONF`** of **this** repo.

## 3. GitHub secrets (this repo → Settings → Secrets and variables → Actions)

| Secret | From |
|---|---|
| `RCLONE_CONF` | step 2 |
| `CLAUDE_CODE_OAUTH_TOKEN` | `claude setup-token` on your PC, **or** `ANTHROPIC_API_KEY` instead. Both channels on one subscription share its usage limits; the two schedules are hours apart (08:17 and 15:03 IST) so the runs don't overlap. |
| `PEXELS_API_KEY`, `PIXABAY_API_KEY`, `OPENVERSE_TOKEN`, `YOUTUBE_API_KEY` | the same values as Crack IT (they are API keys, not channel logins) |
| `GEMINI_API_KEY` | optional; only for one-topic thumbnail variants |
| `ELEVENLABS_API_KEY` | not needed (English goes through local whisper) |

**Variables** (same page, *Variables* tab): `CLAUDE_MODEL` = the model ID or alias every Claude step runs on (empty =
the account's default) and `CLAUDE_EFFORT` = `low` | `medium` | `high` | `xhigh` | `max` (empty = `medium`). The run
page prints the model and effort each step used. A bigger model uses the subscription's limits faster: if a run
stops on a usage limit, pick a smaller model or a lower effort.

**This repo is public.** Keys live only in your local `.env` (git-ignored) and in these secrets. Run logs are
public, so Claude's transcripts go to Drive (`output/_logs/`).

## 4. YouTube upload (on: every episode is scheduled for 20:30 IST)

`config/daily.json` → `youtube.enabled` is `true` (set `false` to send videos to Drive only). Setup, done once:

1. Make a Google Cloud project for this channel (or reuse Crack IT's OAuth client: one client can authorise any
   channel you own), enable *YouTube Data API v3*, create a **Desktop app** OAuth client with scope `youtube.upload`, and
   **publish** the app (Testing-mode tokens expire in 7 days).
2. `node tools/youtube-auth.mjs <client_id> <client_secret>`, sign in and **pick the news channel** (Brand
   accounts list each channel). The refresh token is for that channel only.
3. Secrets in this repo: `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`. Verify the channel's phone number
   (custom thumbnails need it).
4. Set `"enabled": true`. The main video is scheduled for **20:30 IST = 15:00 UTC the same day** (`publishDelayDays: 0`,
   `publishTime` in IST), a slot for a global audience: evening in India, late afternoon in Europe, late morning on the
   US East Coast (early morning on the West Coast). The Shorts go out one an hour apart after it. Category: Science & Technology (`28`).

Until the Cloud project passes YouTube's API audit, API uploads stay Private and you set *Scheduled* in Studio.

**Altered or synthetic content label:** the uploader leaves it **unset** (no `syntheticMedia` in
`config/daily.json`), so you set it yourself in Studio. Add `"syntheticMedia": true` (or `false`) under `youtube` to
have every upload set it.

**Late runs:** a video uploaded after its 20:30 IST slot goes up **Public at once** (Shorts hourly after it); it is
never moved to the next day.

## 5. Schedule, cost, limits

- `cron: "47 2 * * *"` = 08:17 IST. The script's news window is the 24 h before the run starts. GitHub can start
  scheduled runs late. A run with no episode named does nothing when an episode finished less than
  `minHoursBetween` (12) hours ago, so a late schedule plus a manual start never make two episodes in a row.
- **Backup start** `cron: "17 6 * * *"` = 11:47 IST: when the 08:17 run failed or GitHub dropped it, this one makes the
  episode (ready by about 15:00 IST); otherwise it stops after a minute. Day plan, IST: 08:17 news run → ~11:30 done →
  11:47 backup (normally idle) → 15:03 Crack IT's run (other repo; different runners, so even an overlap is fine for
  GitHub, but both use the same Claude subscription, so their Claude parts are kept hours apart) → 20:30 publish.
- **Never a day late:** an upload that happens after 20:30 IST goes up Public at once, not the next day. The
  upload tries 3 times, 5 minutes apart, and resumes instead of duplicating; if it still fails the run turns red
  (GitHub emails you) with the video safe in Drive: run **Upload to YouTube** for that project (it uploads only what is
  missing).
- Run one now: **Actions → Daily edit → Run workflow**.
- Runner: `ubuntu-latest`, 4 CPUs / 16 GB (public repo, free minutes). One episode takes about 2–3 h.
- Every judgment call is in `daily-script-report.md` (stories, sources for every figure) and `daily-report.md`
  next to the video. Read them before posting while the channel is new.

## 6. Failures

When a step fails, only the report is uploaded, to `output/_failed/…`. GitHub emails you, and the Claude
transcripts are in Drive under `output/_logs/`. Fix the cause, then **Run workflow** with the episode name.
