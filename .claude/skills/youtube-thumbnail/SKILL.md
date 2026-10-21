---
name: youtube-thumbnail
description: Design and build a high-CTR thumbnail for a video this repo edited — hook selection, the real face frame pulled from the footage, background cut-out, type set with real fonts (Telugu/Devanagari included), the YouTube 1280x720 thumbnail and the Instagram 1080x1920 cover, an optional image-generation prompt for the background layer, and a feed-size legibility check. Use when the user asks for a thumbnail, thumbnail ideas, a cover image, or how to make the thumbnail more clickable.
---

# Thumbnail (and Reels cover)

## The rule that shapes everything

**An image model cannot produce the creator's real face, and cannot set type** (it mangles Latin and
can't shape Telugu conjuncts at all). A generated "Indian man with glasses" is a stranger, and a
stranger on a personal channel destroys recognition. So every thumbnail is **layers**:
1. the face — a real frame from the footage, cut out;
2. the background/graphic — generated, a frame, or a plain accent gradient;
3. the type — set by `tools/thumbnail.mjs render` with real fonts.
Faceless videos: no face layer; a graphic/stock background + type.

## 1. Read the video first (never ask what it is about)

`work/cleancut.transcript.md`, `work/visual-plan.json` (`big_statement`s are already the punchlines —
the best one is usually the thumbnail line; `chapter_open`s are the sections), the title if the
youtube-metadata skill ran (the thumbnail **completes** the title, never repeats it).

## 2. One hook

The single moment with the biggest gap between what the viewer assumes and what the video says: the
counter-intuitive answer, the number they didn't know, the binary they can't resolve without watching.
For student/early-career audiences: money, jobs and wasted effort; fear of wasted effort beats promise
of reward. Lead with the risk — but only one the video actually delivers.

## 3. Face frame (talking head)

```
node tools/thumbnail.mjs frames <p> --auto            # punch-in moments + big_statement starts
node tools/thumbnail.mjs frames <p> --at 41.2,88.0    # or specific clean-cut times
```
Frames come from the RAW footage at full quality (mapped through `work/timeline.json`). Read them;
pick eyes to camera, brows up or furrowed, mouth mid-word, hands in frame if gesturing. Say which and why.
`node tools/thumbnail.mjs cutout <p> work/thumb/face-41.2.png` → `work/thumb/cutout.png` (Read it:
hair and hand edges intact?).

## 4. Background (optional generated layer)

Give the user an image-generation prompt for the BACKGROUND ONLY, written as composition and lighting,
not a scene: "dark navy studio backdrop, single warm rim light from upper right, soft amber glow on the
left third, fine dot-grid texture, deep vignette, empty negative space on the right two thirds for a
subject cut-out, cinematic, high contrast, 16:9 1280x720". Negative prompt always: `no text, no letters,
no words, no watermark, no logos, no people, no faces, no hands, cluttered, low contrast, busy`.
("no people" matters — the generated layer must not add a second person.) Or skip it: the renderer
draws an accent gradient.

## 5. Render

```
node tools/thumbnail.mjs render <p> --big "NOT ENOUGH" --small "Certificates alone" \
     --native "ఉద్యోగం రాదు" --cutout work/thumb/cutout.png [--background work/thumb/bg.png] \
     --accent "#ffcc00" --side right
```
→ `output/thumbnail-16x9.png` (1280x720) and `output/cover-9x16.png` (1080x1920 Reels cover).
Layout rules baked in: face one third, text the other; two type sizes; bottom-right clear for the
duration stamp. Text 3-4 words; one word huge. A native-script line against an English title signals
the language instantly. Accent = the section accent of the hook's chapter, or the brand's colour if the user named a brand
(`config/brands/<slug>.json`). No brand → no channel styling assumed.

## 5b. Faceless one-topic videos: three variants, a Gemini scene + designed type

The owner's call: the PICTURE comes from Gemini (`tools/gemini-image.mjs`, a photo-real scene); the TYPE, numbers,
logo and badge are always set by `tools/thumb-design.mjs` on top (Inter Display, the brand accent, fine grain,
vignette). An image model never draws text, numbers or logos. Make **three variants that test different ideas**
(YouTube Studio's *Test & Compare* takes up to 3):

| | Template | Idea | Example (d06) |
|---|---|---|---|
| **A** | `headline` + `scene` | the tension in 2-4 words, one word highlighted, over the emotional scene | `"lines": ["Selected.", "*Not* joined."]` |
| **B** | `stat` (+ `scene` optional) | the one number the video explains + 2-4 words, optional `trend` line (`up`/`down`) | `"number": "25,000", "caption": "freshers hired. *Still waiting?*"` |
| **C** | `versus` | this vs that, the right side is the answer the viewer wants (plain grade, no scene) | `left {Selected, YES}`, `right {Joining date, ?}` |

**Scene (Gemini):** one picture that carries the story's emotion, with ONE subject on the right third and empty dark
space on the left. Write the prompt as a photographer's brief: who (an anonymous person who fits the story, never a
celebrity or a named real person), the expression (worried, shocked, relieved, staring at a phone), the place
(hostel room at night, office corridor, campus placement hall), the light (one warm practical light, cool shadows,
low-key). The tool appends the rules (no text, no logos, subject right, left empty) itself.
```
node tools/gemini-image.mjs <p> --name A --n 3 --prompt "young Indian engineering graduate sitting on a hostel bed at night, staring at his phone in disbelief, offer letter beside him, warm desk-lamp light, cool blue shadows"
```
Read every `work/thumb/ai/A-*.png` and reject any with text or letters, a logo, extra fingers or a warped face, the
subject on the left, or a busy left side; regenerate (better prompt) at most twice. Spec `"scene": "work/thumb/ai/A-2.png"`.
No `GEMINI_API_KEY`, or Gemini fails → no scene: use the plain grade (and the stock-photo `person` below), never stop.

Write `output/thumbnails/spec.json` (format in the tool's header: `accent` = the brand colour, `brand` = the channel
name, `kicker` = a short context label like "4 reasons · 2026"), then
`node tools/thumb-design.mjs <p> output/thumbnails/spec.json` → `output/thumbnails/A.png` (+ `A-feed.png`).

**Dramatic extras** (each one earns its place, never all on every variant):
- **Company logo** when the video is about named companies: `node tools/logo.mjs search <p> "Cognizant"` → Read
  `work/thumb/logos/sheet.png`, pick the CURRENT official logo (not an old one, not a sub-brand), then
  `node tools/logo.mjs pick <p> <n> --name cognizant` → `assets/logos/cognizant.svg`; spec `"logo"`. It sits on a
  white plate, top right, untouched (never recoloured or cropped). Two companies compared: use `versus` and put the
  logo of the one the story is about. No logo found → leave it out, never draw one or ask Gemini for one.
- **Badge** (`"badge": "Must watch"`, or "Explained", "New rules", "Update"): 1-2 words, on ONE variant at most.
- **Person** (fallback only, when there is no Gemini scene): a real stock photo, cut out, on ONE variant:
  `node tools/broll.mjs search <p> "shocked young indian man office" --photos --orientation portrait --n 8`, Read
  the candidates, `get` the best, then `node tools/thumbnail.mjs cutout <p> assets/stills/<name>.jpg` → Read
  `work/thumb/cutout.png` → spec `"person": "work/thumb/cutout.png"`. Never `scene` and `person` on one variant.

Rules:
- **Not AI slop:** one accent colour plus off-white on the dark grade. No emoji, arrows, icons, stickers, fake UI or
  extra effects; the Gemini scene must look like a real photo (natural skin, real light), not glossy AI art. Extras
  only as above. If it needs explaining, it is too busy.
- **Words:** ≤ 4 big words per variant, never the title again; the title + thumbnail make one question the video
  answers, and the thumbnail never gives the answer. Highlight exactly one word (`*word*`) in `headline`.
- **Facts:** every number and name comes from the video (transcript, `metadata.md`); write it exactly as the video
  says it. Company names as plain text only.
- **Check:** Read every PNG and every `*-feed.png` (214 px wide, the size in the feed). Text clipped, wrapping
  badly, or the big words unreadable at feed size → shorten and render again.
- Write `output/thumbnails/thumbnails.md`: each variant's idea and text, and which one to use as the main thumbnail
  (the others go into Test & Compare).

## 5c. The daily news roundup (this channel's default): one template, today's hook and cast

Every daily episode uses the SAME design (the `roundup` template, brand accent, brand name), so the channel is
recognisable in the feed, but the **words are new every day**: a dramatic **hook** from that day's script, never a
routine line like "What happened in the last 24 hours". **No kicker** (no "Software · AI · Hardware" label) and
**no date** (the title carries it). The layout: on the left a small **tag**, the hook, an accent bar and a row of up
to 4 company **logos**; on the right **1–4 cut-out people** (white outline, the lead big in front with an accent halo
and ring behind, the rest behind them); a white **stat chip** where the two sides meet; all over a graded **photo
background** of the lead story (or the template's tech grid). **A recognisable face is the strongest part of the
thumbnail: every episode has at least one person (4 at most).** A thumbnail with only logos is a failure, unless step
1's whole fallback list found nobody.

0. **Write the hook** (`lines`): 2–3 short lines, about 3–6 words in all, each line ≤ 14 characters, the words
   spelled as people know them, with normal spaces ("OpenAI eyes", "AI chips"). Two emphasis marks, each used once
   at most: `*…*` puts the key word in the accent box (the number, the stake), `^…^` sets one word in yellow a size
   bigger (the hot word: "^AI^ chips", "Open^AI^", "^raise?^"). Each line is sized on its own, so a short line
   ("DAY", "*$30B*") comes out big: put the strongest word on a short line of its own. Take it from the lead story or
   the cold open's sharpest moment: the number, the stake, the surprise ("Nvidia's / *$5 trillion* / day",
   "OpenAI eyes / *$30B* / ^raise?^", "^AI^ chips / *banned* / in China?").
   It must be true to the script: no claim the video doesn't make, no number it doesn't say, a `reported` story
   phrased as a question or "report:", never words put in a person's mouth (no quote marks next to a face). Write
   2–3 candidates in `thumbnails.md`, pick the one that makes someone curious enough to click, and render it.

1. **Choose the cast** from the episode's `*_stories.json`: rank companies and people by the summed `weight` of the
   stories they appear in. Take the top **1–4 people** (aim for 2–3 on a day with several big names) and the top 2–4
   companies (a logo of a company whose CEO is already in the cast is still welcome). Skip `reported: true` stories
   when ranking people: never put a face next to an unconfirmed claim about them.
   - **Big names first:** among people of similar weight, prefer the most widely recognised (Jensen Huang, Sam
     Altman, Sundar Pichai, Satya Nadella, Tim Cook, Elon Musk, Mark Zuckerberg, Dario Amodei, Lisa Su …) over a
     less known executive.
   - **Fewer than one person? Go down this list until you have one** (each time the **current** CEO or
     founder-leader, checked today; never for a lawsuit, a breach or a failure blamed on that person):
     a) the lead story's company, when the lead is its own confirmed news (a launch, results, a deal it announced),
        e.g. an NVIDIA chip launch → Jensen Huang;
     b) the company of the next confirmed story, by weight (the lead may be `reported`: then the face belongs to
        another, confirmed story of the day, and the hook can still be the lead's — as a question);
     c) a person already in the library (`node tools/library.mjs list`) whose company is in one of today's
        confirmed stories.
     Only when all three find nobody (or every cut-out fails in step 2) → no people, and say so in `thumbnails.md`.
2. **The library** (`inbox/library/`, synced with Drive, never in git): `node tools/library.mjs list`. For each
   cast member not in it yet:
   - logo: `node tools/library.mjs search logo "OpenAI"` → Read `inbox/library/_candidates/sheet.png`, pick the
     CURRENT official logo (not an old one, not a sub-brand; it must read on the white plate) →
     `node tools/library.mjs pick <n> --name openai`
   - person: `node tools/library.mjs search person "Sam Altman"` → Read the sheet, pick a clear, recent,
     front-facing photo with the head and shoulders in frame (not a group shot, not a candid mid-word grimace, not
     a photo more than ~5 years old when newer ones exist) → `node tools/library.mjs pick <n> --name sam-altman` →
     Read `inbox/library/people/sam-altman.png`: hair and shoulders cut cleanly, nothing of the old background,
     the face unaltered. A bad cut-out → pick another candidate; none good → leave that person out.
   Nothing free-licensed found → leave it out, never draw, generate or recolour a logo or a face.
3. `node tools/library.mjs use <p> openai sam-altman …` → copies them to `assets/library/` and adds the credits
   (photographer + licence) to `work/credits.json`. Photo credits go in the video description ("Thumbnail photos:
   <name> by <author>, <licence>, via Wikimedia Commons").
4. **The extras** (each optional, each true to the script):
   - `tag`: one or two words, ≤ 12 characters, in the tag pill above the hook: "Official" (the lead is a company's
     own announcement), "Report" (the lead is `reported` — use it whenever the hook is about a reported story),
     "Leak", "Just in", "Banned", "Recall" … only a word the script backs. None fits → leave it out.
   - `stat`: `{"value": "$2B", "trend": "up" | "down"}`, a number the video says (≤ 6 characters), from a story the
     hook doesn't already carry: never the hook's own highlighted number twice. `trend` only when the number is a
     rise or a fall (shares, revenue, users). No second number worth it → leave it out.
   - `bg`: a landscape stock photo of the lead story's subject (a chip, a data centre, a phone, a server room, a
     city skyline for a policy story): `node tools/broll.mjs search <p> "<subject>" --photos --orientation landscape`
     → Read the thumbnails → `node tools/broll.mjs get <p> <id> --photos --name thumb-bg` → `assets/stills/thumb-bg.jpg`
     (credited automatically). No people, no readable brand or logo in it, no news screenshot. The template darkens
     and tints it; the search fails or nothing fits → leave it out (the tech grid is drawn instead).
5. Spec `output/thumbnails/spec.json` with ONE variant, most important person first:
   ```json
   {"accent": "<brand accent>", "brand": "<brand shortName, upper case>", "variants": [
     {"name": "A", "template": "roundup", "tag": "Official", "lines": ["^Nvidia's^", "*$5 trillion*", "day"],
      "people": ["assets/library/jensen-huang.png", "assets/library/sam-altman.png"],
      "logos": ["assets/library/nvidia.svg", "assets/library/openai.svg", "assets/library/google.svg"],
      "stat": {"value": "+6%", "trend": "up"}, "bg": "assets/stills/thumb-bg.jpg"}]}
   ```
   `node tools/thumb-design.mjs <p> output/thumbnails/spec.json` → Read `A.png` and `A-feed.png`: every face
   recognisable at feed size (a face mostly hidden behind another → drop that person, or reorder), the white outline
   clean all round each person (no white blocks from a bad cut-out), logos not crushed, the stat chip not over a
   face, nothing over the text. Too crowded → drop the weakest extra first (stat, then the 4th person), never the
   last person.
6. `thumbnails.md`: the hook candidates and the pick, the cast and why (which fallback step, if any), the tag and
   stat with the script line that backs them, each image's source and licence.

Rules: editorial use only — a real person's photo appears only because they are in today's news; never add text
next to a face that puts words in their mouth, never imply a person endorses anything, no caricature or edits
beyond the background cut-out. Logos untouched on white plates.

## 6. Check before handing over

Read the feed-size previews (`work/thumb/preview-120-*.png`): big word readable? face recognisable?
Does it duplicate the title? Would a stranger get it? Does the video deliver what it implies?

## Don't

No fabricated logos, certificates, salary slips or documents; no trademarks by default (flag, let the
user decide); no reflexive red arrow + shocked face — credibility over alarm; no emoji.
