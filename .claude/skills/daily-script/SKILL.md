---
name: daily-script
description: The UNATTENDED script step of the daily run in GitHub Actions — research the last 24 hours of tech and AI news and write today's roundup episode (script + voiceover + stories.json with the companies and people for the thumbnail), ready for the voice step. A planned episode folder that already exists in the series comes first. Use only when the prompt says it is the daily script step (or the user asks to rehearse it locally).
---

# Daily script step (no human in the loop)

The workflow has pulled the Drive inbox into `inbox/` and run `node tools/daily.mjs next`, which said the next
episode needs a script. Your prompt names that episode and today's date/time. After you stop, the workflow runs
`node tools/daily.mjs script-check`, then the voice step reads the voiceover **word for word** (a built-in male TTS
voice), then the `daily-run` skill edits it. Nobody reads the script before it is voiced, so it must be right.

## Ground rules

- **Nobody will answer a question.** Decide, and write each decision in `daily-script-report.md`.
- Never generate audio, never touch other episodes' audio, never print `.env`.
- Read first: `config/daily.json` (series folder, standing brief), `config/brands/ai-news.json` (audience, tone,
  title formula, thumbnail), the format below, and the `TTS reads` lines in `docs/lessons.md`.
- Series folder = `config/daily.json` → `series`. List its `dNN/` folders and read the **last three** episodes'
  `*_stories.json` (or their `# Day …` script headings), so today's roundup does not repeat yesterday's stories.

## 1. Which episode

1. **A planned folder named in the prompt already has a `*_script.md`** (the owner dropped one in Drive): make its
   voiceover from the ```` ```vo ```` blocks (their text, in order, paragraphs separated by one blank line), write
   its `*_stories.json` if missing (section 6), check its facts are still current, and stop there.
2. **Otherwise (the normal day): a fresh roundup** in a new folder, the number the prompt gives.

## 2. The news window and the pick

- **Window: the last 24 hours** before the prompt's time (IST). A story older than 24 h is in only when there is a
  real new development today, and then the development is the story.
- **Search widely**, then open the original: company blogs/newsrooms and press releases (OpenAI, Google/DeepMind,
  Anthropic, Microsoft, Meta, Apple, Amazon, NVIDIA, xAI, Mistral, Samsung, Indian tech firms), official government
  and regulator pages (MeitY, PIB, FTC, EU Commission), exchange filings, and reputable outlets (Reuters, AP,
  Bloomberg, The Verge, TechCrunch, Ars Technica, Wired, CNBC, Financial Times, The Economic Times, Mint,
  Moneycontrol, The Hindu BusinessLine). Never a social post or an aggregator as the source.
- **Pick 6–10 stories** that a tech/AI follower would be annoyed to have missed: launches and model releases,
  funding/acquisitions/earnings that move the industry, policy and regulation, big outages/security incidents,
  research that changes what tools can do, India tech and AI news with real weight. Skip rumours, minor app
  updates, listicles and anything already covered in the last three episodes without a new development.
- **Order:** the biggest story first (it is the cold open's lead and the title's lead), then mix weights so the
  middle does not sag; end on a lighter or forward-looking story.
- A thin day is fine: 6 solid stories beat 10 padded ones. Fewer than 4 checkable stories → `status: failed`.

## 3. Shape (copy exactly)

- **S00 · Cold open** (60–90 words): "Here is what happened in tech and A.I. in the last twenty four hours." then the
  three biggest headlines in one line each, then "Let's get into it."
- **S01 … SNN · one story each** (70–130 words): what happened (who, what, when) → the one number or detail that
  matters → why it matters to the viewer, in plain words. No filler, no "in today's fast-moving world".
- **SZZ · Close** (40–70 words): one line that ties the day together, a specific comment question about one of the
  stories, "subscribe for tomorrow's roundup". Never promise a specific story for tomorrow.
- **Length 800–1,150 words** of voiceover (~5–7 minutes at the voice's pace).
- **Tone** (brand notes): a calm, quick news anchor. No hype ("insane", "game changer", "shocking"), no "guys".
  Report claims as claims: "OpenAI says…", "according to Reuters…".
- **Names:** folder `dNN/`, files `dNN_<date_slug>_script.md`, `dNN_<date_slug>_voiceover.txt` and
  `dNN_<date_slug>_stories.json`, where `<date_slug>` is `ai_tech_news_<d>_<mon>_<yyyy>` in lower case
  (e.g. `d12_ai_tech_news_14_oct_2026_script.md`).

## 4. Facts (the voice step cannot fix a wrong number)

- Every figure, date, name, title and quote needs a source you actually opened in this run. Official sources first;
  media figures need two reputable outlets that agree, else round to what they share ("about") or leave it out.
- Reported-but-unconfirmed news is "reported by <outlet>", never stated as fact; label it on screen ("Reported").
- People's current roles must be right today (who is C.E.O. now) — check, don't remember.
- Never invent a quote. Never state a future event as certain ("is expected to", "plans to").
- If you cannot build a correct episode at all, stop: write `daily-script.json` with `"status": "failed"`.

## 5. Writing for the voice (it reads every character)

- Acronyms with dots: `A.I.`, `C.E.O.`, `U.S.`, `E.U.`, `G.P.U.`, `A.P.I.`; brands as they are said: "Open A.I.",
  "Nvidia", "x A.I.", "Deep Mind", "Chat G.P.T.", "G.P.T. five". Avoid bare `I.T.` (the TTS says "eye").
- Numbers in words: "six point six billion dollars", "forty percent", "the fourteenth of October", "two thousand
  twenty six". Rupee figures in crore ("twelve thousand crore rupees"), dollar figures in millions/billions.
- No symbols, digits, brackets, braces, URLs, emojis, markdown or stage directions in the voiceover. Short spoken
  sentences. One blank line between paragraphs; one idea per paragraph (the voice step chunks on them).

## 6. The files

**`dNN_<slug>_script.md`** (the edit follows it as its direction pass):
`# Day NN · AI & Tech News, <D Mon YYYY>`, then the item table: Post date, Title (the brand's `titleFormula`,
≤ 100 characters, the 2–3 biggest names), Alt title, Length, Thumbnail (the cast: which logos and people, from
`stories.json`). Then a **sources list**: one line per story with every figure, its outlet/official page, the
date, and the link. Then per scene `### S01 · <short headline>`, a ```` ```vo ```` block (identical to the
voiceover text for that scene) and a **Screen** list. On screen every story gets: a `ChapterDots` story counter
("Story 3 of 8"), a `NewsCard` with the real source (headline + outlet + date) that `tools/news.mjs` can
screenshot, and where it helps one of `StatCounter`, `CompareChart`, `Timeline`, `FlowDiagram`, `ChecklistPanel`,
`QuoteCard` (real, sourced quotes only), `TipBadge`, plus stock-footage searches written as *search "…"*. Company
logos and photos of people are for the thumbnail, not for b-roll; in the picture, name them in text.

The ```` ```vo ```` blocks joined in order must equal the voiceover file exactly.

**`dNN_<slug>_stories.json`** (the thumbnail and metadata steps read it):
```json
{"date": "2026-10-14", "stories": [
  {"n": 1, "headline": "OpenAI ships …", "weight": 5, "companies": ["OpenAI"], "people": ["Sam Altman"],
   "source": "https://…", "reported": false}
]}
```
`weight` 1–5 (5 = the day's lead). `companies` = organisations the story is about (not every name mentioned);
`people` = real public figures the story is about, full names as Wikipedia titles them ("Dario Amodei",
"Narendra Modi"). Leave a list empty rather than pad it.

## 7. Finish

Write at the repo root:
- `daily-script.json`: `{"episode": "dNN", "status": "ok"|"failed", "kind": "planned"|"fresh", "stories": <count>, "notes": "…"}`
- `daily-script-report.md`: the stories chosen and why, the strong stories left out and why, every figure with
  its source link, anything the owner should check before the video goes out.

Then check your own work: read the voiceover once more as if you were the TTS (any digit, brace, symbol or `I.T.`
left?), confirm the vo blocks match it, and that every story in the script is in `stories.json`. Do not commit,
push or upload — the workflow does that.
