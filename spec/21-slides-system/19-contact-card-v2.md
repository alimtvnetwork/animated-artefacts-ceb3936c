# Spec 19 — Contact Card v2 (`QrMeetingSlide` Contact Layout)

> **Codename to refer to in chat:** "**contact card**" (or "contact card v2",
> "contact slide"). When the user says "use the contact card here" any AI
> must rebuild the slide following this spec verbatim. The runtime source of
> truth is `src/slides/types/QrMeetingSlide.tsx → ContactLayout`. JSON is
> `slideType: "QrMeetingSlide"` with a non-empty `contactRows` (and/or `cta`)
> array.
>
> This spec **supersedes** `12-contact-card.md`. The earlier spec is kept for
> archival reasons; the canonical token list and the variation rules below
> take precedence on any conflict.

---

## 0. What this is

The deck's hero "Let's talk" slide. Two columns:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│     ┌────────────────────┐    LET'S BUILD TOGETHER               │
│     │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │                                       │
│     │ ▓ White QR card  ▓ │    RiseupAsia                         │
│     │ ▓ red finders +  ▓ │    ━━━━━                              │
│     │ ▓ wordmark pill  ▓ │                                       │
│     │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │    [📍] 30 N Gould St, STE R, …       │
│     └────────────────────┘    [✉] contact@riseup-asia.com       │
│                                [☎] +1 (567) 978 1833             │
│         Scan to connect        [📅] [ Schedule a Call ]          │
│                                                                  │
│                                in   ✉   gh   fb                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                  ● ● ● ● ● ● ● ● ● ● ● ● ● ● ▬▬▬                    ← deck pagination
```

Background is a deep noir base with two **warm amber radial glows** (one
top-right brighter, one bottom-left fainter). All chrome (header brand
strip, presenter chip) is hidden so the slide reads as a clean closer.

---

## 1. Tokens (locked — do not change without a deck-wide migration note)

All values are HSL inside the renderer. Hex equivalents are listed for
designers comparing to Figma swatches.

### 1.1 Colors

| Token / role               | HSL                                | Hex      | Where it appears                                       |
|----------------------------|------------------------------------|----------|--------------------------------------------------------|
| Background base            | `hsl(240 7% 4%)`                   | `#0A0B0E`| The dark canvas under the radial glows.                |
| Background glow A (TR)     | `hsla(40 100% 50% / 0.08)` → trans | warm amber | Top-right `radial-gradient at 85% 15%`.              |
| Background glow B (BL)     | `hsla(40 100% 50% / 0.04)` → trans | warm amber | Bottom-left `radial-gradient at 15% 85%`.            |
| Primary accent             | `hsl(40 100% 50%)`                 | `#FFAB00`*| Wordmark "Asia", underline bar, icon-tile fill, CTA. |
| Primary accent on dark text| `hsl(240 10% 8%)`                  | `#13131A`| The CTA button label color (black-on-amber).          |
| Text — high contrast       | `hsl(0 0% 100%)`                   | `#FFFFFF`| The "Riseup" wordmark half + headline base.           |
| Text — medium (rows)       | `hsl(240 5% 65%)`                  | `#A4A4AA`| The contact row text.                                 |
| Text — muted (eyebrow/sub) | `hsl(240 5% 45%)`                  | `#71717A`| Eyebrow, "Scan to connect", inactive social icons.    |
| QR card background         | `hsl(0 0% 100%)`                   | `#FFFFFF`| The QR sits on a solid white tile.                    |
| QR finder squares          | `hsl(0 100% 50%)`                  | `#FF0000`| Brand red — only on the white card, never the canvas. |

> *The user's spec calls the accent `#FCA311` (a slightly pinker amber). The
> codebase uses HSL `hsl(40 100% 50%)` which renders as `#FFAB00`. **Both are
> valid** — the brand book accepts either. Renderers must stay on the HSL
> token so a future palette swap is one CSS variable change, not a hex hunt.

### 1.2 Spacing & radii

| Token            | Value         | Notes                                             |
|------------------|---------------|---------------------------------------------------|
| Container padding| `px-16 pt-32 pb-20` | Mirrors every other slide so the brand-strip / pagination clear properly. |
| Two-column gap   | `gap-16 lg:gap-24` | Larger gap on desktop; collapses on mobile.   |
| Max width        | `1200px`      | The whole content block is centered within this.  |
| QR card padding  | `20px (p-5)`  | White space around the QR inside the white tile.  |
| QR card radius   | `16px`        | Inner radius on the white tile.                   |
| QR size          | `340px`       | Square. The renderer scales the SVG/PNG to this.  |
| Headline → underline | `mt-3`    | 12px gap.                                         |
| Underline bar    | `w-[80px] h-[3px] rounded-[2px]` | Short chunky bar in primary accent. |
| Headline → list  | `mt-10`       | 40px gap.                                         |
| List row gap     | `gap-5`       | 20px between rows.                                |
| Icon-tile size   | `40 × 40`, `radius 10` | Amber 10% bg + amber 18px icon.          |
| Icon → text gap  | `gap-4`       | 16px.                                             |
| List → CTA gap   | `mt-6`        | When CTA is rendered standalone (no `cta.icon`).  |
| List → socials gap| `mt-8`       | 32px.                                             |
| Social icon size | `22px`, gap `gap-6` (24px) | Bare icons, no background tile.       |
| CTA button       | `px-6 py-3 rounded-[10px]` | text 15px semibold, amber bg, ink fg.   |

### 1.3 Type ramp

| Element     | Family               | Size                          | Weight | Other                                        |
|-------------|----------------------|-------------------------------|--------|----------------------------------------------|
| Eyebrow     | Inter (body font)    | `13px`                        | 500    | `uppercase`, `letter-spacing: 0.2em`         |
| Headline    | Display (Ubuntu Bold)| `clamp(40px, 4.4vw, 64px)`    | 700    | `letter-spacing: -0.02em`, `leading: 1.05`   |
| Row text    | Inter                | `16px`                        | 400    | `line-height: snug`, `whitespace-pre-line`   |
| CTA label   | Inter                | `15px`                        | 600    | Black-on-amber                               |
| Caption     | Inter                | `14px`                        | 400    | "Scan to connect" under QR                   |

---

## 2. Anatomy

### 2.1 Header (top bar)

The deck-level **Controller pill** lives top-right. It is owned by
`SlideDeckPage` / `ControllerBar`, NOT by the slide. The slide must:

- Hide its own brand-strip (`brandStrip: false`).
- Hide the brand header logo (`showBrandHeader: false`).
- Hide the presenter chip (`showPresenterChip: false`).

This guarantees the controller pill (and the existing `RiseupAsia` logo
header that appears on most slides) get out of the way so the contact card
reads as a closer. The user's reference screenshot shows the controller in
the collapsed two-button state with `37/37 share fullscreen` icons — that
shape is governed by `spec/slides/14-controller-collapsed-v2.md`, not this
spec.

### 2.2 Main content (2 columns)

Grid: `grid-cols-1 lg:grid-cols-[1fr_1.2fr]`. The content column is
intentionally wider than the QR column so the contact list never feels
squeezed.

#### Left column — QR card

1. White rounded tile (`bg-white p-5 rounded-[16px]`) with a soft amber
   shadow (`0 20px 60px -20px hsla(40 100% 50% / 0.15)`).
2. Inside: `<BrandedQR style="riseup-finder" wordmark="RiseupAsia" size={340}>`
   which paints:
   - White background, ink data modules.
   - Three **red** finder squares (top-left, top-right, bottom-left).
   - A small white pill in the dead center holding the wordmark "RiseupAsia".
3. Beneath the tile, centered text: **"Scan to connect"** (`text-muted`,
   `14px`, `mt-5`).

The renderer must **never tint the QR** — the white tile + red finders are
art-directed. Recoloring breaks scanability and brand contrast.

#### Right column — content stack

In order:

1. **Eyebrow** — uppercase, tracking 0.2em, muted gray.
   Default value: `LET'S BUILD TOGETHER`.
2. **Headline** — `splitWordmark()` cuts the title into "Riseup" (white) +
   "Asia" (amber) when the title matches `/^(Riseup)(.*)$/i`. Any other
   string falls back to a single-tone title using the deck preset.
3. **Underline** — 80×3 amber bar with a `scaleX 0→1` entrance
   (delay 0.42s, 0.55s, `[0.22, 1, 0.36, 1]`).
4. **Contact list** — vertical, 20px row gap. Each row:
   - Amber **icon tile** (40×40, 10px radius, amber 10% bg, amber 18px
     icon). Icons resolved from `ROW_ICON` map: `pin | mail | phone |
     globe | calendar`.
   - Row text in `text-foreground/65`. `\n` in the spec produces a
     wrapped multi-line address.
   - When `row.href` is set the whole row becomes an `<a>` and hovers to
     the amber accent (color tween only — no underline, no scale).
5. **CTA** — two modes:
   - **Inline** (`cta.icon` is set): renders as a row inside the contact
     list. The icon tile is to the left of the button so the button
     visually inherits the row rhythm.
   - **Standalone** (`cta.icon` is unset): renders below the list with a
     `mt-6` gap.
   The button itself: amber bg, ink label, `px-6 py-3 rounded-[10px]`,
   ends with a `<ArrowUpRight>` 16px icon, soft amber drop shadow.
6. **Socials** — bare icons, no tile, `gap-6` (24px), `mt-8`.
   - 22px lucide icons.
   - Default color = `text-muted`.
   - Hover swaps to the amber accent. Color-only — no scale, no underline.
   - Each social is a real `<a>` with `aria-label`, `target="_blank"` for
     `https?:` URLs.
   - **Required minimum set** for the canonical Riseup contact card:
     `linkedin`, `mail`, `github`, `facebook`. Authors may add `twitter`
     or `globe` afterwards in any order.

### 2.3 Footer — pagination

Owned by `DotPagination` (spec 13). Bottom-center, opt-in via `/settings`.
This slide must NOT render its own pagination row. The user's screenshot
shows it because the deck-level dot pagination is enabled.

---

## 3. JSON shape

Authoritative example — copy this for any new contact-card-style slide:

```json
{
  "slideNumber": 6,
  "slideName": "contact",
  "slideType": "QrMeetingSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "enabled": true,
  "isClickReveal": false,
  "showBrandHeader": false,
  "showPresenterChip": false,
  "brandStrip": false,
  "titleStyle": "white",
  "titleShimmer": false,
  "content": {
    "eyebrow": "LET'S BUILD TOGETHER",
    "title": "RiseupAsia",
    "qrStyle": "riseup-finder",
    "meetingUrl": "https://meet.rasia.pro/intro-call",
    "contactRows": [
      { "icon": "pin",   "text": "30 N Gould St, STE R, Sheridan,\nWyoming 82801, United States" },
      { "icon": "mail",  "text": "contact@riseup-asia.com", "href": "mailto:contact@riseup-asia.com" },
      { "icon": "phone", "text": "+1 (567) 978 1833",        "href": "tel:+15679781833" }
    ],
    "cta": {
      "icon": "calendar",
      "text": "Schedule a Call",
      "href": "https://meet.rasia.pro/intro-call",
      "variant": "gold"
    },
    "socials": [
      { "icon": "linkedin", "href": "https://www.linkedin.com/company/riseup-asia/", "label": "LinkedIn" },
      { "icon": "mail",     "href": "mailto:contact@riseup-asia.com",                "label": "Email" },
      { "icon": "github",   "href": "https://github.com/riseup-asia",                "label": "GitHub" },
      { "icon": "facebook", "href": "https://www.facebook.com/riseup.asia",          "label": "Facebook" }
    ]
  }
}
```

Field rules (full list lives in `slide.schema.json`):

- `eyebrow`, `title` — strings. Title is split by `splitWordmark()` (see §2.2).
- `qrStyle` — `'clean' | 'riseup-finder'`. The contact card defaults to
  `riseup-finder` because the brand wordmark must be visible at booth
  distance.
- `meetingUrl` — encoded into the QR. The same value is shown by the
  builder's live mini-QR preview (see `MeetingUrlField`).
- `contactRows` — at least 1, max 5 (anything more compresses the
  list and breaks the type ramp).
- `cta.icon` — when set, renders the CTA inline; when unset, renders
  standalone below the list.
- `socials[].icon` — `linkedin | mail | github | twitter | globe |
  facebook`. **`facebook` is required for the canonical Riseup card.**
- `socials[].href` — must be a real URL. `mailto:` and `tel:` are allowed.
- `socials[].label` — accessible label override; defaults to the icon name.

### Semantic naming for renderers

When generating React components from this spec the AI MUST use these names
on the relevant elements (data attributes or component names — pick one
convention and stick to it within the file):

| Spec name                | Element                                              |
|--------------------------|------------------------------------------------------|
| `headerLogo`             | The top-left "RiseupAsia" wordmark (handled by `BrandHeader` when enabled — disabled on this slide). |
| `companyNameLabel`       | The `<h2>` headline in the right column.             |
| `contactPhoneNumberText` | The `phone` row's text node.                         |
| `btnScheduleCall`        | The CTA `<a>` element.                               |
| `socialLinkLinkedIn`     | LinkedIn `<a>`.                                      |
| `socialLinkEmail`        | Mail `<a>`.                                          |
| `socialLinkGitHub`       | GitHub `<a>`.                                        |
| `socialLinkFacebook`     | Facebook `<a>` — **must always be present** in the canonical card. |

These names are convention only — they are not exposed in the JSON spec
(authors don't need them). They exist to give downstream AIs a stable
vocabulary when the user says "tweak `btnScheduleCall`".

---

## 4. Animation contract

All values are scoped to this slide; reduced-motion variants snap to final
state.

| Element           | Initial                     | Animate          | delay (s) | dur (s) | easing                  |
|-------------------|-----------------------------|------------------|-----------|---------|-------------------------|
| Whole card        | `opacity 0, y 24`           | `opacity 1, y 0` | 0         | 0.55    | `[0.22, 1, 0.36, 1]`    |
| Eyebrow           | `opacity 0, x -8`           | `opacity 1, x 0` | 0.10      | 0.40    | default                 |
| Headline          | `opacity 0, x -12`          | `opacity 1, x 0` | 0.18      | 0.50    | `[0.22, 1, 0.36, 1]`    |
| Underline bar     | `scaleX 0` (origin `left`)  | `scaleX 1`       | 0.42      | 0.55    | `[0.22, 1, 0.36, 1]`    |
| Each contact row  | `opacity 0, y 8`            | `opacity 1, y 0` | `0.55 + i*0.08` | 0.40 | default              |
| Inline CTA row    | same as a row               | same             | `0.55 + rows*0.08` | 0.40 | default              |
| Standalone CTA    | `opacity 0, y 8`            | `opacity 1, y 0` | `0.55 + rows*0.08 + 0.05` | 0.40 | default       |
| Socials row       | `opacity 0, y 6`            | `opacity 1, y 0` | `0.55 + rows*0.08 + 0.15` | 0.40 | default       |

**Reduced motion**: drop all `x`/`y`/`scaleX` tweens; opacities still fade
in but with `duration: 0` so the slide simply appears.

---

## 5. Variations

The contact card is one component but supports several legible variations
**by changing only the JSON, never the renderer**:

### V1 — Canonical Riseup (the screenshot)
Defaults above. White wordmark + amber accent on "Asia", `riseup-finder`
QR, all four socials.

### V2 — Personal contact (single human)
- `title: "Alim Karim"` — `splitWordmark()` falls back; the whole title
  renders white via `titleClassFor(spec)`.
- Socials shrink to `linkedin + mail` only.
- `cta.text: "Book 30 min"`, `cta.href: <calendly>`.

### V3 — Booth / kiosk (loop-friendly)
- `qrStyle: "clean"` — drops the brand wordmark from the QR for maximum
  scan speed at distance.
- `cta` omitted — the QR is the only call to action.
- Socials omitted.
- Eyebrow: `"SCAN TO CONNECT"`. Title: `"RiseupAsia"`.

### V4 — Sales handoff (multi-channel)
- All five socials: `linkedin, mail, github, facebook, twitter`.
- Adds a fifth `contactRow` with `icon: "globe"` pointing at the website.
- `cta.icon` unset → CTA renders standalone below the list (more
  prominent).

### V5 — Minimalist
- `eyebrow` omitted. No socials. No CTA.
- `contactRows` reduced to a single `mail` row.
- `qrStyle: "clean"`.

### Variation hard rules

When generating a variation, an AI must:

1. **Never recolor the QR card** — the white tile + red finders are
   art-directed. Re-style with `qrStyle` only.
2. **Never replace the amber accent with the project's gold token** on this
   slide. The contact card explicitly uses the warm amber `hsl(40 100% 50%)`
   — that's why it has its own background gradient. Other slides use the
   project gold (`hsl(45 60% 54%)`). They are intentionally different.
3. **Never add scale-on-hover** to socials or rows. Color-only hovers; the
   surface stays still.
4. **Never stack more than 5 contact rows** before adding a CTA.
5. **`facebook` belongs in `socials` whenever the company has a public
   Facebook page**, even when the deck is private. It's part of the
   canonical Riseup contact set.

---

## 6. Accessibility

- The whole content card is wrapped in a `<motion.div>` with no extra
  landmark; the page-level `<main>` from `SlideDeckPage` is the landmark.
- Headline is a real `<h2>` so screen-readers find the slide title.
- Each contact row that has an `href` is a real `<a>`; rows without `href`
  are inert `<div>`s (no false interactivity).
- Each social is a real `<a>` with an `aria-label` (defaults to the icon
  name; override via `socials[].label`).
- The CTA is a real `<a>`. Hover state shifts via `lift-hover` (subtle
  brightness lift); focus state is the global `focus-visible` ring.
- Decorative QR square logos are inside `<BrandedQR>` and announce the
  meeting `label` (or the slide title) as their `alt`.

---

## 7. Files of record

- Renderer: `src/slides/types/QrMeetingSlide.tsx → ContactLayout`
- Sub-components: `ContactIconTile`, `ContactListRow`, `CtaListRow`,
  `splitWordmark` (same file)
- QR component: `src/slides/components/BrandedQR.tsx`
- Meeting resolver: `src/slides/meeting.ts` (turns `meetingUrl` /
  `meetingLabel` into a `{ url, label, qrAsset }` triple)
- Type defs: `src/slides/types.ts → SocialLink`, `ContactRow`, `ContactCta`
- JSON schema: `spec/slides/slide.schema.json`
- Showcase deck slide: `spec/slides/showcase/06-contact.json`
- Memory mirror: `.lovable/memory/features/contact-card-v2.md`
- Predecessor (kept for archive): `spec/slides/12-contact-card.md`

---

## 8. Test checklist

1. The slide renders on a deep noir background with two warm amber radial
   glows visible at the corners.
2. The QR is a white tile with **red** finder squares and a centered white
   pill containing "RiseupAsia".
3. Below the QR sits the muted-gray caption "Scan to connect".
4. The headline is split into white "Riseup" + amber "Asia"; an 80×3 amber
   bar grows in left-to-right under it.
5. The contact list has 3 rows (pin / mail / phone) with amber tile
   icons; the address row wraps onto two lines via `\n`.
6. The CTA renders inline as a 4th list row (because `cta.icon` is
   `calendar`); it's an amber button with black "Schedule a Call" text +
   an arrow-up-right icon.
7. The socials row contains exactly 4 icons in this order: LinkedIn,
   Mail, GitHub, Facebook. Each is a real link with an `aria-label`.
8. Hover over any social shifts its color to amber — no scale, no
   underline.
9. With `prefers-reduced-motion: reduce` the slide composes immediately
   with no entrance tweens.
10. The slide hides its brand strip, brand header, and presenter chip; only
    the deck-level controller pill and dot pagination are visible.
