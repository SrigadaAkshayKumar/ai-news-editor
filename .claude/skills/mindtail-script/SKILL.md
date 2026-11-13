---
name: mindtail-script
description: The UNATTENDED MINDTAIL script step in GitHub Actions (branch mindtail) — pick topics and write a batch of Hindi/Hinglish YouTube Shorts scripts, each with a *_voiceover.txt the owner pastes into ElevenLabs and a *_script.md the edit follows. Use only when the prompt says it is the MINDTAIL script step (or the user asks to rehearse it locally).
---

# MINDTAIL script step (no human in the loop)

The workflow pulled the Drive folder `MINDTAIL/inbox/` into `inbox/` and ran `node tools/mindtail.mjs next-ids`.
Your prompt gives the IDs to use, today's date and an optional note from the owner (topics, count, tone).
After you stop: `node tools/mindtail.mjs script-check` validates your files, then the workflow copies each new
folder to Drive. **The owner copies `*_voiceover.txt` into ElevenLabs as it is**, generates the Hindi voice,
and uploads the audio into the same Drive folder; the `mindtail-edit` skill then edits it.

## Ground rules

- **Nobody will answer a question.** Decide; write each decision in `mindtail-script-report.md`.
- Read first: `config/mindtail.json` (topics, word range, brief), `config/brands/mindtail.json` (audience, tone,
  content rules), `docs/mindtail/brand-guidelines.md`, `docs/mindtail/backlog.md`.
- Read the existing Shorts in `config/mindtail.json` → `series` (their `*_script.md` titles) and
  `config/mindtail-state.json`, so no topic repeats.
- Never generate audio, never print `.env`, never commit or upload (the workflow does).

## 1. Pick the topics

- **Every topic must be about the MIND or human behaviour** — the channel is MINDTAIL: why the brain does what it
  does, psychology effects, biases, habits, emotions, relationships, social behaviour, mysteries of the mind. A
  random fact (animals, space, history) only qualifies when the Short is really about the human mind (e.g. what an
  experiment revealed about people). Ask: "would a viewer say *this is a MINDTAIL video*?" If not, drop it.
- One Short per ID in the prompt. The owner's note wins (a topic, a series, a count).
- Otherwise spread the batch across `config/mindtail.json` → `topics`; evergreen over news; one idea per Short.
- **Score each candidate** 1-5 on curiosity, evergreen, emotional/shock value, how well real stock footage can
  show it, originality, and how well it can be sourced. Take the best; note the runners-up in the report.
- Reject: anything you cannot verify, fake psychology "facts", conspiracy as truth, tragedy for clicks, medical
  or psychological diagnosis, accusations against private people, stereotypes.

## 2. Facts (the voice cannot fix a wrong claim)

- "Shocking" must be true. Every factual claim (a number, a study, a date, a name, "scientists found…") needs a
  source you opened in this run: a primary/official/academic source, or two reputable outlets that agree.
  Search, open, read the page; record URL, outlet, date read off the page, and the exact sentence it supports.
- A claim you cannot confirm is cut or rewritten as clearly framed opinion. Never invent a study, statistic or
  quote. Psychology effects: say what was found and its limits ("कई लोगों में", not "हर इंसान").
- A story that is fiction or a dramatisation says so in the script and on screen ("काल्पनिक कहानी").
- Relatable/opinion Shorts (friendship, college life) need no sources but must not be presented as science.

## 3. Shape: the reel template (35-75 seconds), curious documentary voice

The narrator is a curious investigator uncovering how the mind works ("ऐसा क्यों होता है?", "और यहीं से कहानी
बदलती है..."), never a lecturer. Every Short has exactly three parts, written as `## HOOK`, `## BODY`, `## END` in
the script (the edit builds its picture and sound on them):

- **HOOK (one or two lines, 0-3 s):** the most surprising true line or question, the curiosity gap. No greeting,
  no "दोस्तों", no channel name. Write 3 hook options; use the strongest.
- **BODY:** setup in one line, then escalation: short spoken sentences, a new detail or a raised stake every line,
  a turn ("पर असली वजह कुछ और है...") before the reveal. Plant one held beat ("...") right before the key reveal.
- **END:** the payoff that delivers exactly what the hook promised (the reveal, the reason, the twist), one line
  of takeaway for the viewer's own life, then one natural comment question. No "like share subscribe" begging,
  no fake cliffhanger.
- **Length:** `config/mindtail.json` → `voiceoverWords` (about 2.4 Hindi words per second).

## 4. Writing the voiceover for ElevenLabs (it reads every character)

- Natural spoken Hindi in **Devanagari**. Everyday English words that young Indians say in English stay in
  **Latin script** so the voice pronounces them in English: phone, social media, notification, college, exam.
- **Numbers as words** ("तीन सेकंड", "सत्तर प्रतिशत", "उन्नीस सौ चौंसठ"). No digits, symbols (%, ₹, $, &),
  brackets, braces, URLs, emojis, hashtags or markdown — `script-check` rejects them.
- Pauses: end sentences with "।" or "?"; use "..." for a held beat before a reveal; a blank line between
  paragraphs. No audio tags.
- Read it aloud in your head once: no tongue-twisters, no long compound sentences, names spelled as said.

## 5. The files (per Short)

Folder `<series>/<ID>-<slug>/` (slug: 2-4 lowercase English words, e.g. `MT-0004-phone-habit`):

**`<ID>_voiceover.txt`** — only the words to be spoken, nothing else.

**`<ID>_script.md`**:
```
# <ID> · <working title>
Topic: … · Type: factual | opinion | fiction · Est. length: … s

## Hook options
1. … 2. … 3. …   (chosen: n)

## Title ideas (Hindi/Hinglish, curiosity-driven, honest)
1. … 2. … 3. …

## HOOK
### S01 · <beat>
```vo
<exactly the voiceover text for this beat>
```
**Screen:** what the viewer sees. The edit is simple and footage-first (about 80% stock video and photos), so
give **one stock shot per line of narration** (a new shot every 1.5-3 s): video clips as *search "…"* and about a
quarter of the shots as photos that will move, *photo "…"* — literal and filmable ("teenager scrolling phone in
bed at night", "close-up of an anxious face", not "addiction"). The HOOK gets the most striking shot. Then on-screen text only
where it helps (2-4 words, which word is highlighted), a number graphic only for a number the voice says, and the
SFX moment (whoosh / riser / hit / silence).
## BODY
### S02 · <beat>
…
## END
### S0N · Payoff
…

## Sources
- <claim> — <outlet/official page>, <date on the page>, <URL>
```
The ```` ```vo ```` blocks joined in order (one blank line between) must equal the voiceover file exactly.

## 6. Finish

At the repo root:
- `mindtail-script.json`: `{"status": "ok"|"failed", "shorts": ["MT-0004-phone-habit", …], "notes": "…"}`
- `mindtail-script-report.md`: per Short the topic, why it was picked, word count and estimated seconds, every
  claim with its source, what the owner should check, plus the runners-up not written.

Check your own work before stopping: no digit, symbol or bracket left in any voiceover; vo blocks equal the
voiceover; every factual claim has a source line. If you cannot write a single correct Short, write
`"status": "failed"` with the reason.
