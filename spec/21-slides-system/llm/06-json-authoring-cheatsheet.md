# 06 — JSON Authoring Cheatsheet

Copy-paste templates. Every template is **valid against
`spec/slides/slide.schema.json`** as of v0.77.0.

> 🧭 **Need the full inventory of legal values** (every slide type,
> transition, text animation, capsule color, expand animation, step
> motion variant) **with counts and a machine-readable index?** See
> [`28-component-and-animation-catalog.md`](./28-component-and-animation-catalog.md)
> and its companion [`CATALOG.json`](./CATALOG.json).

---

## 0. Decision tree — pick a slide type

```
"Is this the first slide of the deck?"
   ├─ yes  → TitleSlide
   └─ no
       │
       ├─ "Is it a section break / chapter title?"
       │     └─ yes → MiddleTitleSlide   (one big phrase, ambient bg)
       │
       ├─ "Is the whole content a few standalone words?"
       │     └─ yes → KeywordSlide       (e.g. "STRATEGY · DESIGN · GROWTH")
       │
       ├─ "Is it 2–6 capsule chips with optional click-reveals?"
       │     └─ yes → CapsuleListSlide
       │
       ├─ "Is it a chain of 3–6 steps shown all at once?"
       │     └─ yes → StepTimelineSlide  (default for 'process / journey')
       │
       ├─ "Is it 3–7 steps where each fills the screen as a moment?"
       │     └─ yes → AdvanceStepSlide   (camera dolly between frames)
       │
       ├─ "Is it a one-step-at-a-time carousel with neighbor peeks?"
       │     └─ yes → FocusTimelineSlide (presenter-paced, Next/Prev)
       │
       ├─ "Is it primarily a single image?"
       │     └─ yes → ImageSlide
       │
       ├─ "Does it ask the audience to scan a QR / contact us?"
       │     └─ yes → QrMeetingSlide
       │
       └─ "Is it a divider between sections?"
             └─ yes → SectionDividerSlide
```

---

## 1. Common top-level fields (every slide)

```jsonc
{
  "slideNumber": 1,                    // unique within the deck
  "slideName": "lowercase-hyphenated", // matches filename suffix
  "slideType": "TitleSlide",
  "transition": "FadeIn",              // FadeIn | SlideIn | PushIn | PushLeft | PushRight
  "textAnimation": "FadeIn",           // FadeIn | Bounce | SlideUp | Stagger
  "enabled": true,
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "titleStyle": "cream",               // cream | white | gold | gradient(legacy)
  "titleShimmer": false,
  "notes": "speaker-only notes (markdown light)",
  "content": { /* slide-type-specific */ }
}
```

---

## 2. TitleSlide

```jsonc
{
  "slideNumber": 1,
  "slideName": "title",
  "slideType": "TitleSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "isClickReveal": false,
  "showBrandHeader": false,
  "showPresenterChip": false,
  "titleStyle": "gold",
  "titleShimmer": true,
  "ambientBackground": "productivity",
  "sound": { "on": "enter", "kind": "whoosh", "volume": 0.45 },
  "content": {
    "title": "Building Asia's\nNext Wave",
    "subtitle": "Strategy · Design · Growth",
    "capsules": [
      { "text": "Strategy", "color": "gold" },
      { "text": "Design",   "color": "ember" },
      { "text": "Growth",   "color": "cream" }
    ],
    "animations": {
      "title": "titleSlide",
      "capsules": "cinematicCapsules"
    }
  }
}
```

---

## 3. MiddleTitleSlide (chapter break)

```jsonc
{
  "slideNumber": 16,
  "slideName": "ideas-to-share",
  "slideType": "MiddleTitleSlide",
  "transition": "FadeIn",
  "textAnimation": "Bounce",
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "titleStyle": "cream",
  "ambientBackground": "minimal",
  "content": {
    "eyebrow": "Chapter Two",
    "title": "Ideas to Share",
    "subtitle": "Three patterns we've shipped this year"
  }
}
```

---

## 4. KeywordSlide

```jsonc
{
  "slideNumber": 5,
  "slideName": "promise",
  "slideType": "KeywordSlide",
  "transition": "PushIn",
  "textAnimation": "Stagger",
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "content": {
    "keywords": ["STRATEGY", "DESIGN", "GROWTH"]
  }
}
```

---

## 5. CapsuleListSlide

```jsonc
{
  "slideNumber": 2,
  "slideName": "capabilities",
  "slideType": "CapsuleListSlide",
  "transition": "SlideIn",
  "textAnimation": "FadeIn",
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "content": {
    "eyebrow": "What we do",
    "title": "Capabilities",
    "capsules": [
      { "text": "Brand Strategy", "color": "gold",   "hoverText": "Positioning" },
      { "text": "Product Design", "color": "ember",  "hoverText": "UX + UI" },
      { "text": "Growth",          "color": "cream", "clickRevealSlide": 9 },
      { "text": "Engineering",     "color": "violet" }
    ]
  }
}
```

---

## 6. StepTimelineSlide  (default "process" slide — full template)

```jsonc
{
  "slideNumber": 3,
  "slideName": "process",
  "slideType": "StepTimelineSlide",
  "transition": "SlideIn",
  "textAnimation": "SlideUp",
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "brandStrip": false,
  "titleStyle": "white",
  "titleShimmer": false,
  "sound": { "on": "focus", "kind": "whoosh", "volume": 0.5 },
  "content": {
    "eyebrow": "How we work",
    "title": "Engagement Process",
    "steps": [
      { "label": "Step 1", "title": "Discovery", "subtitle": "Listen, audit, align",
        "description": "Two-week intake — interviews + audit + alignment workshop.",
        "capsule": { "text": "Week 1", "color": "gold" } },
      { "label": "Step 2", "title": "Strategy",  "subtitle": "Frame the bet",
        "description": "Narrow to a single, measurable bet. One page, one team.",
        "capsule": { "text": "Week 2-3", "color": "ember" },
        "cta": { "text": "See sample", "revealSlide": 7, "variant": "gold" } },
      { "label": "Step 3", "title": "Build",     "subtitle": "Ship in increments",
        "description": "Two-week increments. Demo every Friday.",
        "capsule": { "text": "Week 4-8", "color": "cream" },
        "leftOffsetPx": 28 },
      { "label": "Step 4", "title": "Scale",     "subtitle": "Compound the wins",
        "description": "Ongoing optimisation. Quarterly review against the bet.",
        "capsule": { "text": "Ongoing", "color": "outline" } }
    ]
  }
}
```

> The full step-system playbook is `02-step-system-complete.md` —
> always read that before editing a step slide.

---

## 7. AdvanceStepSlide  (camera-dolly variant)

```jsonc
{
  "slideNumber": 12,
  "slideName": "advance-process",
  "slideType": "AdvanceStepSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "isClickReveal": false,
  "showBrandHeader": false,
  "showPresenterChip": true,
  "brandStrip": true,
  "sound": { "on": "focus", "kind": "whoosh", "volume": 0.45 },
  "content": {
    "eyebrow": "How we work",
    "title": "Engagement, in motion",
    "steps": [
      { "label": "Step 1", "title": "Discovery", "subtitle": "Two weeks of listening.",
        "capsule": { "text": "Week 1", "color": "gold" } },
      { "label": "Step 2", "title": "Strategy",  "subtitle": "Frame the bet.",
        "capsule": { "text": "Week 2-3", "color": "ember" } },
      { "label": "Step 3", "title": "Build",     "subtitle": "Ship in increments.",
        "capsule": { "text": "Week 4-8", "color": "cream" } },
      { "label": "Step 4", "title": "Scale",     "subtitle": "Compound the wins.",
        "capsule": { "text": "Ongoing", "color": "outline" } }
    ]
  }
}
```

> `showBrandHeader: false` — the slide paints its own header overlay.
> Two logos would stack.

---

## 8. FocusTimelineSlide

```jsonc
{
  "slideNumber": 8,
  "slideName": "focus-process",
  "slideType": "FocusTimelineSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "content": {
    "eyebrow": "Process",
    "title": "Step by step",
    "direction": "horizontal",
    "windowSize": 3,
    "steps": [
      { "label": "01", "title": "Discovery", "description": "Two-week intake." },
      { "label": "02", "title": "Strategy",  "description": "Narrow the bet." },
      { "label": "03", "title": "Build",     "description": "Ship in increments." },
      { "label": "04", "title": "Scale",     "description": "Compound." }
    ]
  }
}
```

---

## 9. QrMeetingSlide  (contact card)

```jsonc
{
  "slideNumber": 6,
  "slideName": "contact",
  "slideType": "QrMeetingSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "content": {
    "eyebrow": "Let's build",
    "title": "Schedule a call",
    "meetingUrl": "https://cal.com/riseup-asia/intro",
    "meetingLabel": "cal.com/riseup-asia/intro",
    "qrStyle": "riseup-finder",
    "contactRows": [
      { "icon": "mail",     "text": "hello@riseup.asia", "href": "mailto:hello@riseup.asia" },
      { "icon": "phone",    "text": "+60 11 1234 5678",   "href": "tel:+60111234567" },
      { "icon": "pin",      "text": "Kuala Lumpur,\nMalaysia" }
    ],
    "cta": { "text": "Schedule a Call", "href": "https://cal.com/riseup-asia/intro", "icon": "calendar", "variant": "gold" },
    "socials": [
      { "icon": "linkedin", "href": "https://linkedin.com/company/riseup-asia" },
      { "icon": "facebook", "href": "https://facebook.com/riseupasia" }
    ]
  }
}
```

---

## 10. ImageSlide

```jsonc
{
  "slideNumber": 7,
  "slideName": "team-photo",
  "slideType": "ImageSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "isClickReveal": false,
  "showBrandHeader": false,
  "showPresenterChip": true,
  "content": {
    "eyebrow": "Meet the team",
    "title": "The people behind the work",
    "image": "images/team.jpg"
  }
}
```

---

## 10a. FullBleedImageSlide (edge-to-edge hero)

```jsonc
{
  "slideNumber": 8,
  "slideName": "chapter-hero",
  "slideType": "FullBleedImageSlide",
  "transition": "FadeIn",
  "textAnimation": "SlideUp",
  "content": {
    "eyebrow": "CHAPTER 02",
    "title": "The photo is the slide",
    "subtitle": "One quiet line of context over the scrim.",
    "image": "images/hero.jpg",
    "scrim": "bottom"
  }
}
```

---

## 10b. SplitMediaSlide (show + tell)

```jsonc
{
  "slideNumber": 9,
  "slideName": "show-and-tell",
  "slideType": "SplitMediaSlide",
  "transition": "PushLeft",
  "textAnimation": "Stagger",
  "content": {
    "eyebrow": "SHOW + TELL",
    "title": "Media meets message",
    "mediaSide": "left",
    "image": "images/product.jpg",
    "keywords": ["Fast", "Legible", "On-brand"],
    "capsules": [{ "label": "Live", "tone": "gold" }]
  }
}
```

---

## 10c. MediaGridSlide (gallery / logo wall, 2–6 tiles)

```jsonc
{
  "slideNumber": 10,
  "slideName": "gallery",
  "slideType": "MediaGridSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "content": {
    "eyebrow": "GALLERY",
    "title": "A grid of moments",
    "mediaTiles": [
      { "src": "images/a.jpg", "caption": "One" },
      { "src": "images/b.jpg", "caption": "Two" },
      { "src": "images/c.jpg", "caption": "Three" }
    ]
  }
}
```

---

## 11. SectionDividerSlide

```jsonc
{
  "slideNumber": 4,
  "slideName": "divider-process",
  "slideType": "SectionDividerSlide",
  "transition": "PushLeft",
  "textAnimation": "Bounce",
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "content": {
    "eyebrow": "Section Two",
    "title": "How we work"
  }
}
```

---

## 12. ClickRevealSlide (hidden detail)

Same as any normal slide, but set:

```jsonc
{
  "isClickReveal": true,
  "parentSlide": 2
}
```

The slide is excluded from linear flow and only reachable via a parent
capsule's `clickRevealSlide` or `expand.cta.onClickRevealSlide`.

---

## 13. Hotspots (free-floating click-reveal)

Drop into ANY slide's `content`:

```jsonc
"hotspots": [
  { "revealSlide": 12, "x": 10, "y": 30, "width": 25, "height": 20,
    "label": "Strategy detail", "style": "ghost" }
]
```

`x / y / width / height` are **percentages** of the 1920 × 1080 stage.
`style: "outline"` while authoring (faint dashed box), `"ghost"`
(default) for the audience.

---

## 14. deck.json (the manifest)

```jsonc
{
  "deckSlug": "showcase",
  "deckName": "Riseup Asia · 2026 Deck",
  "presenter": "MD ALIM UL KARIM",
  "theme": "noir-gold",
  "preset": "premium",
  "brandStrip": {
    "logoAsset": "riseup-asia",
    "logoHeight": 22,
    "logoAlign": "left",
    "padding": "cozy",
    "tagline": "Riseup Asia LLC · 2026 Deck",
    "taglineTone": "cream",
    "divider": true,
    "background": "solid"
  },
  "meeting": {
    "url": "https://cal.com/riseup-asia/intro",
    "label": "cal.com/riseup-asia/intro"
  },
  "slides": [
    "01-title",
    "02-capabilities",
    "03-process",
    "04-divider-process",
    "06-contact",
    "16-middle-title"
  ]
}
```

The `slides` array is **filename stems** (no `.json`). Order = display
order. Disabled slides (`enabled: false`) stay in the array but skip
the linear flow.

---

## 15. Animation preset cross-reference

| Preset | Visual character | Best for |
|--------|------------------|----------|
| `fadeIn`           | Soft fade + tiny upward drift | Default |
| `slideUp`          | Larger upward slide | Headlines |
| `slideInLeft`      | Enters from left edge | Stat blocks |
| `slideInRight`     | Enters from right edge | Stat blocks |
| `pushLeft`         | Stronger left push | Hero blocks |
| `pushRight`        | Stronger right push | Hero blocks |
| `bounce`           | Springy scale-in | One hero element only |
| `stagger`          | Like fadeIn, spaces siblings further | Capsule rows |
| `cinematicCapsules`| Blur → focus + spring overshoot | Title-slide capsule rows |
| `titleSlide`       | Spring scale-in (no upward slide) | Long titles that look unsettled with bounce |
| `none`             | Instant | Use sparingly |

Override any block via `content.animations`:

```jsonc
"content": {
  "animations": {
    "title": "pushLeft",
    "capsules": "cinematicCapsules"
  }
}
```

Targetable blocks: `eyebrow`, `title`, `subtitle`, `keywords`,
`capsules`, `steps`.

---

## 16. Last-mile checklist before committing a new slide

- [ ] `slideNumber` is unique in the deck.
- [ ] `slideName` matches the JSON filename suffix (lowercase, hyphenated).
- [ ] `transition` differs from the previous and next slide's `transition`.
- [ ] Content is **keywords**, not paragraphs (description fields excepted).
- [ ] No hard-coded hex anywhere (search the JSON, no `#` followed by
      6 hex digits in any string).
- [ ] If it's a step slide, `description` is ≤ 2 sentences per step.
- [ ] If it's a hero slide, `sound.on === "enter"`.
- [ ] If it's a step slide, `sound.on === "focus"`.
- [ ] Companion `.md` exists with a one-paragraph design intent note.
- [ ] Added to `deck.json → slides[]` in the right position.
- [ ] `package.json` patch version bumped.
