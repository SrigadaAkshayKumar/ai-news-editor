---
name: mindtail-edit
description: The UNATTENDED MINDTAIL edit in GitHub Actions (branch mindtail) — turn one Short's Hindi ElevenLabs voiceover into a finished 9:16 curious-documentary YouTube Short (hook/body/end template, clear stock video + animated photos, Hindi captions, small animations, music + SFX), verify it and write its metadata, for the workflow to put in Google Drive. Never uploads to YouTube. Use only when the prompt says it is the MINDTAIL edit (or the user asks to rehearse it locally).
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

- **One format: 9:16**, made natively (not cut from 16:9). Shorts are 35-75 s; never pad. The workflow also makes
  a 1.15x fast copy after your edit (the one the owner publishes): pace the picture so it still reads at that
  speed (no on-screen text shorter than ~1.2 s).
- **Language Hindi, free word timings**: create with `--lang hi`, then `npm run transcribe -- <p> --engine align`:
  the script (`*_voiceover.txt`) is force-aligned to the audio with Meta's MMS model (`tools/align/align.py`), free
  and local, no ElevenLabs key or credits. The words ARE the script, so caption spelling is exact. Read
  `work/script-diff.md`: "never spoken" passages mean the audio and the script disagree (the owner generated a
  different text) — say so in the report; if more than a sentence is missing, stop with status failed. Whisper is
  useless on Hindi (lessons); use `--engine elevenlabs` only if the prompt asks for it.
- **Captions ON**: word-synced Hindi captions, 2-3 words. Nothing readable in the caption band from the picture
  pass (lessons).
- **Look**: `config/mindtail.json` → `looks[0]` (broadcast, karaoke captions, yellow `#FFD700` key words) unless
  the brief names another: create the project with that `--style`, caption with `npm run captions -- <p> --style
  <captions> --accent <accent>`. In `work/visual-plan.json` set **`"clear_footage": true`** and **`"rail": false`**.
- **Clear footage (the owner's top rule)**: stock footage must be fully visible: no dark layer, no blur, no glassy
  panes over it. `clear_footage` removes the scene floor and the takeover blur; on top of that use the `neutral`
  grade (no `noir`/`cool` darkening), keep takeovers (`title_slide`, `big_statement`) short (≤ 2.5 s) and never
  use more than two of them. Read the stills: if footage looks dimmed or veiled anywhere, fix it before rendering.

## The reel template (every Short follows it)

Map the script's `## HOOK`, `## BODY`, `## END` sections onto the clean-cut times and build each part on purpose:

| Part | Time | Picture | Sound |
|---|---|---|---|
| **HOOK** | 0 to ~3 s (the hook line) | `title_slide` over the first line at frame 0 (2-4 words, the curiosity question), the most striking clip, the fastest cuts (1-1.5 s), a `flash` or `whip` into shot 2 | an **impact/hit on frame 0**, the music bed already in (no slow fade-in), a whoosh on the first cut |
| **BODY** | hook end → the payoff line | a new shot for every new idea (1.5-3 s), video clips mixed with **animated photos**, small animated callouts on the key words, a `number_roll` for any number the voice says, a **riser into the key reveal**, a `whip` or `flash` on the turn | a sub whoosh on each new idea (not every cut), the riser, a short **silence (0.3-0.5 s)** right before the reveal line |
| **END** | the payoff line → end | the payoff line on the strongest shot (or one short `big_statement`), then the closing question as a `keyword_chip`/`lower_third` while the last shot slowly zooms; hold the last frame ~0.5 s after the voice | a **hit on the payoff**, the music resolves/fades on the last word, no SFX on the closing question |

Name the three parts and their times in the report.

## Picture: attractive curious documentary — 80% clips, 20% animation and other material

The owner's split, by runtime:
- **About 80%: stock VIDEO clips** (`broll`), clear and fully visible. Pexels first, Pixabay fallback, literal
  searches from the script's *search "…"* lines. These carry the story.
- **About 20%: animation and other material**, spread through the Short (never all at the end), at least one beat
  every 8-10 s:
  - **Motion-graphic beats** on `graphic` scenes (2-3 s each): kinetic type (`big_statement`, `word_swap`,
    `quote_pull` for a real sourced quote), `number_roll` / `stat_trio` for numbers the voice says, `flow_diagram`
    or `checklist` for a process or the "how it works" step, `bar_chart` / `comparison` for a study's result. On a
    `graphic` scene the corner/dock layouts are fine (there is no footage to shrink); give the scene a `card` when a
    layout docks.
  - **Real people the script names** (the scientist, the researcher): a portrait from the library (below) as a
    `still` scene with a slow `ken_in` and a `lower_third` with name + role + year ("Elizabeth Loftus · psychologist
    · 1974"). Only real, freely licensed photos; if none exists, skip the portrait and show the study instead
    (a graphic, the setting in stock footage). Never a stand-in stock face presented as the real person.
  - **Moving photos** (`still` scenes with `ken_in`/`ken_out`/`pan_*`) for close-ups or objects video can't find.
- **Small animations over the clips** keep the 80% lively: `keyword_chip`, `annotation` underline/circle on the key
  word, `side_note`, camera `punch_in` on reveals, `whip`/`flash` transitions on the turns. Vary them: never the same
  overlay type twice in a row. Over FOOTAGE scenes no `dock`/`band`/`corner` layouts (they shrink the clip).
- **Good footage only.** For every shot run 2-3 differently worded searches and pick the best candidate, not the
  first hit. Prefer native portrait clips, cinematic light, real-looking people and places, one clear subject, smooth
  camera moves. Reject watermarks/logos, cheesy staged "stock acting", cluttered or badly lit frames, shaky phone
  footage, low-resolution clips, on-screen text. `broll get` warns when a clip must be upscaled: above ~1.35x it is
  visibly soft, choose another. Read a frame after each `get`. No clip or photo twice.
- Stock footage never pretends to be evidence of a named person or real event. Fiction or dramatisation gets an
  on-screen label.
- In the report give the runtime split: video clips / graphic beats / photos and portraits. Video below ~70% or
  animation+other above ~30% means fix the plan first.

### Photos of real people (free licences only)

`node tools/library.mjs search person "Elizabeth Loftus"` → Read `inbox/library/_candidates/sheet.png` → `pick <n>
--name loftus` → `node tools/library.mjs use <p> loftus` (copies it into the project and adds the credit). Commons
holds free files only and the tool rejects anything else. If Commons has nothing, an Openverse image search (CC BY,
CC BY-SA, CC0, public domain only; record creator, licence and source page in `work/credits.json`) is the only other
source. **Never** download a person's photo from a news site, a university page, Google Images or any other website:
those photos are copyrighted and can get the channel a strike. Not found → skip it, no question asked. Every
portrait's credit goes into `metadata.md` (CC BY / BY-SA require it).

## Sound is the craft

One CC0 bed (`npm run bgm -- … --cc0`, Freesound wants 1-2 word queries: "mystery", "suspense", "curious")
matched to a curious/mysterious mood, levelled and ducked under the voice. SFX as in the template table: impact on
frame 0, sub whoosh on new ideas, riser into the reveal, silence before it, hit on the payoff; SFX audible over
the bed; no effect on more than ~1/3 of cues. Check `work/levels.json` after the mix. You cannot hear it: say so.

- Palette black / white, yellow `#FFD700` key words, cyan `#00E5FF` secondary; red only for warnings.
- No intro, no outro, no logo sting.

## Steps

0. **Existing project?** If `projects/` already has a project for this Short (an earlier failed run), its
   `source/` media is not in git: keep its `work/*.json` decisions aside, delete the folder, re-create it with the
   same command, restore what still applies (EDL/plans only if the transcript matches), and continue.
1. **Create**: `npm run new -- <audio> --script <voiceover> --mode faceless --lang hi --formats 9:16 --brand mindtail
   --style <main look's style> --brief "<brief>"`, then transcribe with `--engine align` (above). The `*_script.md` is the direction: its scenes and **Screen** lines are your
   plan (read it in full first).
2. **Edit** with the `edit-video-faceless` skill (all stages, **no review gates**: run straight through), adapted
   to a Short and to **the reel template above**: no chapters, no rail, no polls.
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
