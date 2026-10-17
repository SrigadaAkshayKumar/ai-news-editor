# 24 Hours in Tech — YouTube channel setup sheet

Everything to paste into YouTube when creating the channel. Art is in `docs/channel-art/`.

## 1. Create the channel (Brand Account, ~5 min)

1. Sign in to YouTube with the same Google account as Crack IT.
2. Profile picture → **Settings** → **Add or manage your channel(s)** → **Create a channel**.
3. Name: **24 Hours in Tech** → Create. (This makes a Brand Account; Crack IT is untouched.)
4. Switch to the new channel (profile picture → **Switch account**) before every step below.

## 2. Basic info (studio.youtube.com → Customization → Basic info)

| Field | Value |
|---|---|
| Name | `24 Hours in Tech` |
| Handle | `@24HoursInTech` (fallbacks: `@24HoursInTechNews`, `@24HrsInTech`) |
| Contact email | an inbox you check (a separate address is fine) |

**Description** (paste as is):

```
Everything that happened in tech in the last 24 hours, in one short video every day.

Software, AI and hardware: new launches, model releases, chips and gadgets, big outages, security breaches, funding and policy. We read the announcements and the reporting so you don't have to, and explain why each story matters in plain words.

Every story comes with its source in the description. Unconfirmed reports are labelled as reported.

New video every day at 15:00 UTC (8:30 PM IST).

Narration is an AI voice reading a script researched and written for this channel.

Subscribe and catch up on tech in minutes.
```

**Links:** leave empty for now (add the website/Instagram/X later if you make them).

## 3. Branding (Customization → Branding)

| Item | File | Notes |
|---|---|---|
| Picture | `docs/channel-art/profile-800.png` | 800×800, shown as a circle |
| Banner image | `docs/channel-art/banner-2560x1440.png` | 2560×1440; the text sits inside the 1546×423 area every device shows |
| Video watermark | `docs/channel-art/watermark-150.png` | 150×150; display time: **Entire video** |

## 4. Channel settings (Studio → Settings)

**General:** currency INR (or your payout currency).

**Channel → Basic info**
- Country of residence: **India** (where you live; this decides tax and payout, not the audience)
- Keywords:
  ```
  tech news, tech news today, daily tech news, technology news, AI news, AI news today, tech news this week, software news, hardware news, gadget news, chip news, OpenAI, Google, Apple, Microsoft, Nvidia, Anthropic, tech recap, tech roundup, 24 hours in tech
  ```

**Channel → Advanced settings**
- Audience: **No, set this channel as not made for kids**
- Automatic chapters: **On** (our descriptions add chapters anyway)
- Featured places / product tagging: off

**Upload defaults → Basic info** (each video starts with these; the pipeline overwrites title/description/tags):
- Visibility: **Private** (the pipeline schedules each video)
- Category: **Science & Technology**
- Tags: `tech news, tech news today, 24 hours in tech`

**Upload defaults → Advanced settings**
- Licence: Standard YouTube Licence
- Allow embedding: on · Publish to subscriptions feed: on
- Video language: **English** · Caption certification: None · Title/description language: English
- Comments: **Hold potentially inappropriate comments for review**
- Show how many viewers like this video: on
- **Altered or synthetic content:** see section 7

**Permissions:** only you for now.

**Community → Defaults:** block links in comments; add spam words if they show up.

## 5. Layout and playlists (Customization → Layout)

- **Channel trailer** (for people who haven't subscribed): the best recent episode, once there is one.
- **Featured video** (for returning subscribers): latest upload.
- Playlists to create now (empty is fine; videos get added as they come):
  - `Daily Tech News — 24 Hours in Tech` (every episode)
  - `Shorts: Tech in 60 Seconds`
- Sections: Latest videos · the Daily playlist · Shorts.

## 6. Verification and features (studio.youtube.com → Settings → Channel → Feature eligibility)

- **Verify the phone number** (youtube.com/verify): needed for custom thumbnails, videos over 15 min and live.
- Intermediate features unlock with it; advanced features after some channel history (or ID/video verification).

## 7. AI disclosure

The narration is a synthetic voice. YouTube's "altered or synthetic content" label is required for realistic
content that could mislead (a real person made to say something, a realistic fake event). A synthetic narrator
reading a researched news script over real footage and screenshots usually does not need it, but **disclosing
is the safe default for an all-AI-voice channel**: the description above already says it, and the uploader can
set the label on every upload (`syntheticMedia: true` in `config/daily.json`). Recommended: turn it on.

## 8. Monetisation (later)

YPP needs 1,000 subscribers + 4,000 public watch hours in 12 months (or 10M Shorts views in 90 days). When
eligible: link the **same AdSense account as Crack IT** (one per person; never create a second one).

## 9. Connect it to GitHub (after sections 1–6)

See `docs/cloud-setup.md`, section 4: one OAuth client (Crack IT's can be reused), then
`node tools/youtube-auth.mjs <client_id> <client_secret>`, **pick 24 Hours in Tech** in the account chooser, and
put `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN` in the `ai-news-editor` repo secrets.
