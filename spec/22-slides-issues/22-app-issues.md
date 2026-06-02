# 22 — App Issues Root Cause Log

Date: 2026-04-25 (Malaysia UTC+8)
Deck: Riseup Asia LLC — Showcase

## Issue 22.01 — Branded header strip looks correct in preview but bad in exported / outside rendering

### Symptom

- In the live slide/presenter preview, the branded header strip can look acceptable.
- In exported or external render contexts (PDF/HTML/screenshot/imported deck), the top strip can degrade into a text-only wordmark or inconsistent spacing instead of the Riseup Asia LLC logo asset.

### Root cause

The deck-level `brandStrip` spec only declared:

```json
{
  "logoAlt": "RISEUP ASIA LLC"
}
```

That made `BrandStrip` use the text fallback path instead of the bundled Riseup Asia LLC logo image. Text fallback depends on browser font rendering, letter spacing, export engine support for `background-clip:text`, and external asset/CSS capture behavior. That is why it looked different outside the main preview.

The standard `BrandHeader` used the bundled PNG asset (`src/assets/brand/riseup-asia-logo.png`), but the new `BrandStrip` did not have an export-safe asset registry field equivalent to QR assets.

### Fix

- Added `brandStrip.logoAsset` with registered slug `"riseup-asia"`.
- `BrandStrip` now imports the bundled Riseup Asia logo PNG and resolves `logoAsset: "riseup-asia"` to that built asset URL.
- `logoAsset` is the default, so decks no longer silently fall back to text unless no asset can resolve.
- Updated `spec/slides/showcase/deck.json` to declare:

```json
{
  "brandStrip": {
    "logoAsset": "riseup-asia",
    "logoAlt": "Riseup Asia LLC",
    "logoHeight": 24,
    "logoAlign": "left",
    "padding": "cozy"
  }
}
```

### Prevention rule

For branded strip exports/imports, prefer `logoAsset` over raw `logo`. Use raw `logo` only when the value is an absolute/export-safe image URL. Never rely on text fallback for production exports.

---

## Issue 22.02 — Presenter showcase Next / Previous buttons do not work reliably

### Symptom

- In `/present`, clicking **Next** or the left/right buttons can appear to do nothing.
- The issue is most visible when the audience deck window is closed, unavailable, or the `BroadcastChannel` connection is not active.

### Root cause

`PresenterPage` treated the audience deck as the source of truth for navigation. Its buttons only sent:

```ts
{ type: 'nav', dir: 'next' }
{ type: 'nav', dir: 'prev' }
```

Then the presenter waited for `SlideDeckPage` to receive that message, navigate, and broadcast back:

```ts
{ type: 'slide', n }
```

If the deck window was not open, the browser partitioned the channel, or the channel was temporarily unavailable, the presenter never updated its own `current` state. So the button click had no visible result.

### Fix

- Presenter navigation now updates local presenter state immediately.
- It broadcasts a `jump` message with the resolved target slide number so an audience deck, if present, still follows.
- The presenter no longer depends on the audience deck echo to show the next/previous slide.

### Prevention rule

Presenter controls must be optimistic/local-first: update presenter state first, then broadcast sync. BroadcastChannel sync should mirror state across windows, not be required for the active window's own controls to work.

---

## Issue 22.03 — Branded header strip degrades in print / PDF / HTML capture

### Symptom

Exporting a slide via browser **Print → Save as PDF** or saving the page as standalone HTML (or any headless screenshot tool) renders the brand strip as either:

- a transparent band with only the wordmark/logo visible (no ink background),
- a black box where the radial sheen `::before` was, or
- a missing tagline pill (gradient stripped).

The live preview looks correct because the strip is built from layered effects (linear gradient + `::before` radial sheen + `backdrop-blur` + HSL color tokens) that print/capture engines aggressively strip.

### Root cause

`BrandStrip` styling depends on:

1. `background: linear-gradient(...)` driven by HSL CSS variables.
2. `::before { background: radial-gradient(...) }` decorative layer.
3. `backdrop-filter: blur(...)`.
4. `box-shadow` with HSL tokens.

Print and headless-capture engines drop or mis-render all four unless `print-color-adjust: exact` is set AND the background is a solid (non-gradient) color. There was no print stylesheet in the project, so capture engines fell back to their defaults.

### Fix

Added an `@media print` block plus a `data-export-mode` hook in `src/index.css`:

- Forces `print-color-adjust: exact` on every element.
- Replaces the brand strip's gradient + `backdrop-filter` with a solid `hsl(var(--ink))` and a single gold hairline border (`hsl(var(--gold)/0.55)`).
- Hides the radial sheen `::before` (would otherwise render as a black box).
- Releases `body { overflow: hidden }` so capture engines see the full slide.
- Hides the controller chrome via `[data-print-hide="true"]` (added to `ControllerBar` root) so only the slide content prints.
- The `html[data-export-mode="true"]` selector lets future headless export tooling opt into the same hardening without using `@media print`.

### Prevention rule

Any deck chrome that uses gradients, `backdrop-filter`, or `::before`/`::after` decorative layers MUST also declare a print-safe solid fallback inside `@media print`. New presenter chrome that should not appear in exports must carry `data-print-hide="true"` on its root element.


---

## Resolution status (closeout 2026-06-02)

| Issue | Status | Verified by |
|-------|--------|-------------|
| 22.01 — brand strip text fallback in exports | ✅ Resolved | `brandStrip.logoAsset: "riseup-asia"` default; text fallback only when no asset resolves |
| 22.02 — presenter Next/Prev unreliable | ✅ Resolved | Presenter updates local state immediately + broadcasts `jump`; no longer depends on audience echo |
| 22.03 — brand strip degrades in print/PDF/HTML | ✅ Resolved | `@media print` + `data-export-mode` hardening in `src/index.css`; `data-print-hide` on chrome |

All three carry a documented Fix + Prevention rule above. No open regressions tracked for this log as of closeout.
