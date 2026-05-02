# 21 — Click-Reveal & Hotspots

> **Phase 21/21** · Closes Audit-16 §2.1 (was 2/10). Authoritative source
> for how a blind LLM should author and a blind implementer should render
> click-reveal slides and hotspot regions.

## 1. Two mechanisms, one model

The deck has **two** ways to reach a hidden detail slide. Both navigate
to a target slide via the same router (`navigate('/${revealSlide}')`)
and both rely on the target having `isClickReveal: true`.

| Mechanism | Author surface | When to use |
|---|---|---|
| **Capsule click-reveal** | `capsule.revealSlide: <int>` on any capsule | Discrete keywords — "Strategy", "Brand" — that act as labels-and-buttons |
| **Hotspot region** | `content.hotspots[]` array | Free-floating regions over titles, images, or non-capsule areas |

Targets are **always** declared on the parent slide. The destination
slide simply opts in by setting `isClickReveal: true` + `parentSlide: <int>`.

## 2. Required JSON (parent slide)

Either or both:

```json
{
  "content": {
    "capsules": [
      { "text": "Strategy", "color": "gold", "revealSlide": 4 }
    ],
    "hotspots": [
      {
        "revealSlide": 12,
        "x": 10, "y": 30,
        "width": 25, "height": 20,
        "label": "Strategy detail",
        "style": "ghost"
      }
    ]
  }
}
```

`x`, `y`, `width`, `height` are **percentages of the 1920×1080 stage**
(NOT pixels, NOT viewport units). `(0,0)` is top-left.

`label` is required for accessibility — it's the `aria-label` on the
clickable rect AND the tooltip on hover.

## 3. Required JSON (destination slide)

```json
{
  "slideNumber": 4,
  "isClickReveal": true,
  "parentSlide": 2,
  "content": { "title": "Strategy", "...": "..." }
}
```

If `isClickReveal` is true and `parentSlide` is missing, the deck
loader logs a warning and the back-button degrades to "previous slide
in linear order" — never the right behaviour. **Always pair them.**

## 4. Hotspot styles

| `style` | Visual | Use when |
|---|---|---|
| `"ghost"` (default) | Invisible — `bg-transparent`, no border. Only the cursor changes to pointer on hover. | Production. The audience must not see hotspots. |
| `"outline"` | Faint gold dashed border `border border-dashed border-gold/40` | Authoring/QA only — flip to `"ghost"` before presenting. |

`"outline"` exists exclusively so authors can verify rectangles sit
where they intended. Never ship a deck with `"outline"` hotspots.

## 5. Layer / z-index contract

```
z=2 slide body
z=20 HotspotLayer  ← clickable rects, absolutely positioned, pointer-events: auto
z=30 ClickRevealBadge  ← rendered ONLY on slides where isClickReveal === true
z=40 BrandHeader / BrandStrip / ControllerBar
```

Hotspots sit **above** capsules so a hotspot that overlaps a capsule
"wins" (the hotspot handler fires, the capsule click does not). The
ClickRevealBadge never overlaps the slide body — it pins to `top-20
left-1/2` (`src/slides/components/ClickRevealBadge.tsx`).

## 6. Component map (runtime truth)

| Concern | File / symbol |
|---|---|
| Hotspot rendering | `src/slides/components/HotspotLayer.tsx` |
| Capsule reveal click | `src/slides/components/Capsule.tsx` (reads `spec.revealSlide`) |
| Hidden-detail badge | `src/slides/components/ClickRevealBadge.tsx` |
| Reveal-hints toggle | `src/slides/controls/ControllerBar.tsx` (`Eye`/`EyeOff` button + `localStorage['riseup.revealHints']`) |
| Linear-flow exclusion | `src/slides/loader.ts` (filters out `isClickReveal === true`) |

## 7. Reveal hints (presenter affordance)

The Eye/EyeOff button on the controller toggles `revealHints`. When on:

- Click-reveal capsules get `ring-1 ring-gold/60 animate-pulse-soft`.
- The `↗` arrow on those capsules turns gold instead of dim.
- Hotspots stay invisible (they are NOT highlighted by hints — by design,
  they're meant to be discovered through the title / image).

Hints persist via `localStorage['riseup.revealHints']` so the toggle
survives deck navigation. The button is hidden when no slide on the
deck declares any reveal entrypoints.

## 8. Acceptance checklist

- [ ] Every parent slide with reveals declares at least one of:
      `capsule.revealSlide` or `content.hotspots[]`.
- [ ] Every destination slide pairs `isClickReveal: true` + `parentSlide`.
- [ ] Hotspot coordinates are in **percentages**, not px or vw.
- [ ] No `style: "outline"` survives in shipped JSON.
- [ ] `ClickRevealBadge` renders on every reveal target (verify by
      navigating directly via `/N`).
- [ ] Hitting deck Next from a reveal target returns to `parentSlide`,
      not the next-numbered slide.

## 9. Open questions

- Should hotspots support keyboard focus + Enter? Currently no — only
  capsules and the controller are focusable. Track in spec 21 §9.
