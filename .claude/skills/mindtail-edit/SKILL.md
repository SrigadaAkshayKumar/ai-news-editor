---
name: mindtail-edit
description: The UNATTENDED MINDTAIL edit in GitHub Actions (branch mindtail) — turn one Short's Hindi ElevenLabs voiceover into a finished 9:16 YouTube Short (real stock b-roll, Hindi captions, motion graphics, music + SFX), verify it and write its metadata, for the workflow to put in Google Drive. Never uploads to YouTube. Use only when the prompt says it is the MINDTAIL edit (or the user asks to rehearse it locally).
---

# MINDTAIL edit (no human in the loop)

The workflow pulled `MINDTAIL/inbox/` from Drive, picked one Short (`node tools/mindtail.mjs ready`), installed
everything and wrote `.env`. Your prompt names the Short's folder, its audio, voiceover, script and brief. After you
stop, `node tools/mindtail.mjs check <folder>` must pass, then the workflow copies `projects/<p>/output/` to
Drive `MINDTAIL/output/<folder>/`. **There is no YouTube step**: the owner reviews every Short first.

## Ground rules

- **Nobody will answer a question.** Decide and write it in `mindtail-report.md`. If the job is impossible (no
  audio, audio that does not match the script, a claim on screen you cannot source), stop and write
  `mindtail-run.json` with `"status": "failed"` and the reason.
- **Read `docs/lessons.md` first**, then `config/mindtail.json` (standing brief), `config/brands/mindtail.json`,
  `docs/mindtail/brand-guidelines.md`. A `brief.txt` in the Short's folder (in the prompt) overrides the standing
  brief where they clash.
- 4 vCPU / 16 GB runner: one render at a time, never in parallel. Never alter the voice. Never print `.env`.

## Standing rules

- **One format: 9:16**, made natively (not cut from 16:9). Shorts are 40-80 s; never pad.
- **Language Hindi, free word timings**: create with `--lang hi`, then `npm run transcribe -- <p> --engine align`:
  the script (`*_voiceover.txt`) is force-aligned to the audio with Meta's MMS model (`tools/align/align.py`), free
  and local, no ElevenLabs key or credits. The words ARE the script, so caption spelling is exact. Read
  `work/script-diff.md`: "never spoken" passages mean the audio and the script disagree (the owner generated a
  different text) — say so in the report; if more than a sentence is missing, stop with status failed. Whisper is
  useless on Hindi (lessons); use `--engine elevenlabs` only if the prompt asks for it.
- **Captions ON**: word-synced Hindi captions, 2-3 words. Nothing readable in the caption band from the picture
  pass (lessons).
- **Look**: the main look is `config/mindtail.json` → `looks[0]` (visual `style`, caption style and accent) unless
  the brief names another; create the project with that `--style` and caption with `npm run captions -- <p>
  --style <captions> --accent <accent>`.
- **Picture: a SIMPLE, footage-first edit (the owner's style).** About **80% of the runtime is full-frame stock
  footage**: `broll` scenes (video clips) and `still` scenes (photos, slow Ken-Burns), from Pexels with Pixabay as
  fallback, literal searches taken from the script's *search "…"* lines (`--photos` for stills). Read the thumbnails
  before every `get`; the clip must show what the line says. A cut every 1.5-3 s; no clip repeated.
  - `graphic` scenes (no footage) at most ~20% of the runtime, only where footage can't show it.
  - Overlays stay light: the `title_slide` over the first line at frame 0, then mostly `full`-layout ones
    (`keyword_chip`, `side_note`) and at most one or two `number_roll`/`big_statement` beats for the key number
    or the reveal. **No `dock`, `band` or `corner` layouts** (they shrink the footage into a card), no chapter rail,
    no polls, no marquee/glitch.
  - In the report, give the share of runtime that is full-frame footage; below ~75% means fix the plan first.
  - Stock footage never pretends to be evidence of a named person or real event. Fiction or dramatisation gets an
    on-screen label.
- **Sound is the craft**: one CC0 bed (`npm run bgm -- … --cc0`, Freesound wants 1-2 word queries) matched to the
  Short's mood, levelled and ducked under the voice; sub-band whoosh on cuts, a riser into the reveal, a hit on
  the payoff, a short silence before the key line; SFX audible over the bed; no effect on more than ~1/3 of cues.
  Check `work/levels.json` after the mix. You cannot hear it: say so in the report.
- Palette black / white / cyan `#00e5ff`; yellow and red only for warnings.
- No intro, no outro, no logo sting.

## Steps

0. **Existing project?** If `projects/` already has a project for this Short (an earlier failed run), its
   `source/` media is not in git: keep its `work/*.json` decisions aside, delete the folder, re-create it with the
   same command, restore what still applies (EDL/plans only if the transcript matches), and continue.
1. **Create**: `npm run new -- <audio> --script <voiceover> --mode faceless --lang hi --formats 9:16 --brand mindtail
   --style <main look's style> --brief "<brief>"`, then transcribe with `--engine align` (above). The `*_script.md` is the direction: its scenes and **Screen** lines are your
   plan (read it in full first).
2. **Edit** with the `edit-video-faceless` skill (all stages, **no review gates**: run straight through), adapted
   to a Short: one chapter or none, no chapter rail, no polls, the hook in the first 2 s, the payoff at the end.
   Through `npm run finalize -- <p>` and `npm run verify -- <p>`; Read the verify sheet and stills yourself and fix
   anything broken. `verify` must end with `structure ok`.
3. **Metadata** → `projects/<p>/output/metadata.md`:
   - 3-5 title options (Hindi/Hinglish, curiosity-driven, honest, ≤ 100 characters; the first is the pick),
   - description: one line of context, a blank line, credits that must be there (CC BY sources if any; music
     credit if its licence asks), the sources block for factual claims, then `#MINDTAIL #HindiShorts` + 1-3 topic
     hashtags,
   - suggested cover frame time, and the altered/synthetic content disclosure answer with a reason (AI voice:
     usually "no" when nothing realistic is faked; say why).
   Copy `work/credits.json` facts into it; never invent a credit.
4. **Report** at the repo root:
   - `mindtail-run.json`: `{"short": "<folder>", "project": "<p>", "status": "ok"|"failed", "notes": "…"}`
   - `mindtail-report.md`: duration, scenes and searches used, SFX/bed choices and levels, every on-screen claim and
     its source, anything the owner must look at or listen to. Copy it into `projects/<p>/output/` too.

Do not commit, push or upload: the workflow does that after `check` passes. Do not render look variants: when
the owner asks for them, the workflow runs `tools/variants.mjs` itself after the main Short is in Drive.
