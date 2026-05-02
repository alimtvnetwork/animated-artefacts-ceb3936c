# 32 — Step Timeline v3.3 (Centered 1440px Composition)

**Supersedes the layout rules in spec 30 (fullscreen-layout-polish) for the
StepTimelineSlide ONLY.** Motion timing (spec 23 v3), fixed-slot rows
(spec 27 v3.2), Poppins typography, ghost numeral, breathing halo, and
ambient field are all UNCHANGED. v3.3 fixes the long-running "still in
the middle / still left-jammed" complaint by replacing the hard-left lock
from v3.2 with a **centered 1440px master content area** on the
1920×1080 canvas.

## 0. Why v3.3 exists

v3.1 centered everything → header floated, step list felt lost.
v3.2 hard-locked everything to the left logo gutter → right side became
dead space and the composition felt lopsided. The user's clarification
(repeated 4 times) is: **centered composition, but the inner two-column
body is anchored so the header title and step list share the same left
sight line.** Symmetric 240px margins on both sides. Done.

## 1. Canvas Grid (1920 × 1080)

| Token                          | Value     | Notes                                        |
|--------------------------------|-----------|----------------------------------------------|
| `--slide-safe-inset`           | `80px`    | Safe area on every edge                      |
| `--slide-content-max-width`    | `1440px`  | Hard cap for ALL centered content            |
| `--slide-content-x-start`      | `240px`   | `(1920 - 1440) / 2`                          |
| `--slide-content-x-end`        | `1680px`  | `1920 - 240`                                 |
| `--slide-header-zone-top`      | `80px`    | Inside safe area                             |
| `--slide-header-zone-height`   | `180px`   |                                              |
| `--slide-body-zone-top`        | `300px`   | 40px gap below header                        |
| `--slide-body-zone-height`     | `560px`   |                                              |
| `--slide-footer-zone-top`      | `900px`   | 40px gap below body                          |
| `--step-list-column-width`     | `560px`   | Left grid column                             |
| `--step-detail-column-width`   | `800px`   | Right grid column                            |
| `--step-body-gutter`           | `80px`    | Between the two columns                      |
| `--step-decorative-number-size`| `32rem`   | Background ghost numeral (already exists)    |

Math sanity: `560 + 80 + 800 = 1440 ✓`. Margins: `(1920 − 1440) / 2 = 240 ✓`.

The slide is a **vertical stack** of three zones, all sharing the same
`1440px` centered container:

```
┌──────────────────── 1920 ────────────────────┐
│  240    ┌───────── 1440 ─────────┐    240    │
│  margin │       Header Zone      │   margin  │  80–260
│         ├────────────────────────┤           │  300–860
│         │  Step List │ Detail    │           │
│         │   560      │   800     │           │
│         ├────────────────────────┤           │  900–1000
│         │       Footer Zone      │           │
│         └────────────────────────┘           │
└──────────────────────────────────────────────┘
```

## 2. Header Zone

- Container: `1440px`, centered (`x: 240 → 1680`).
- Contents stack vertically, **left-aligned within the container**.
- Eyebrow → 12px gap → Title.
- The header container's left edge **MUST equal the Step List column's
  left edge** (both at `x = 240`). This is the visual anchor of the
  whole slide.

## 3. Body Zone — Two-Column Grid

- Outer container: `1440px`, centered, height `560px`.
- CSS Grid:
  ```css
  grid-template-columns: 560px 800px;
  column-gap: 80px;
  align-items: center;
  ```
- **Both columns vertically centered** inside the 560px body zone.
- Geometric centerline `x = 960` falls 80px inside the right column.
  This is **intentional and acceptable** — the right column carries the
  heavier reading-text mass, so optical center sits left of geometric
  center, and the composition feels balanced.

### 3a. Decorative ghost numeral (background layer)

- `position: absolute`, `right: 80px`, `top: 50%`,
  `transform: translateY(-50%)`.
- `z-index: 0`, `pointer-events: none`, `aria-hidden`.
- Existing v3 cross-fade behavior preserved — only the position changes
  from `right: -2vw / top: 14vh` to the symmetric anchor above so it
  sits behind the right column instead of bleeding off-canvas.

## 4. Left Column — Step List

- Width: `560px`, content left-aligned.
- Above the list: small `STEP 0X / 0Y` label + autoplay toggle (existing).
- Step rows: spacing/sizing unchanged from spec 27 v3.2.
- The active step's text MUST NOT exceed the column's right edge
  (`x = 800` absolute). Long titles wrap.

## 5. Right Column — Active Step Detail Panel

- Width: `800px`, content left-aligned.
- `align-self: center` inside its grid cell so the panel's vertical
  midpoint matches the active step row's midpoint (within 8px tolerance).
- Stack: eyebrow + underline → 32px gap → description (`max-width: 720px`)
  → 28px gap → meta capsule.
- **No background card, no border, no fill.** Pure typography on the
  slide background.

## 6. Footer Zone

- Page dots horizontally centered at canvas centerline (`x = 960`),
  unchanged.
- Prev/next chevrons stay anchored to the right safe area.

## 7. What MUST be removed from the implementation

1. Any `margin-left: 0 !important` / `padding-left: 2.5rem !important`
   that pushes the slide content to the left edge.
2. The asymmetric 3-column grid `0.47fr 0.36fr 0.17fr` — replaced with
   the fixed `560px 80px 800px` two-column grid.
3. The `width: 100% !important` / `max-width: none !important` overrides
   on `.step-timeline-content` in fullscreen/wide mode — content must
   be capped at `1440px` and centered with `margin-inline: auto`.
4. `max-w-7xl` (1280px) Tailwind utility — replaced with the explicit
   `1440px` token so v3.3 doesn't share a cap with arbitrary slides.

## 8. Critical alignment rules

1. Header title **left edge** ≡ Step List column **left edge** ≡
   `x = 240px`.
2. Step Detail Panel **right edge** ≤ Header container **right edge** ≡
   `x = 1680px`.
3. Empty space left of `x = 240` and right of `x = 1680` is **equal**
   (240px each).
4. Footer dots stay centered on the canvas centerline (`x = 960`), NOT
   on the body content centerline.
5. The composition is symmetric around `x = 960`, even though the inner
   two-column grid is asymmetric. This is what makes it "feel centered"
   while still anchoring the step list and header title to the same
   left sight line.

## 9. Acceptance criteria

- [ ] Header title and step list left edges line up to the pixel.
- [ ] Left margin equals right margin (240px each on a 1920px canvas).
- [ ] No content jammed against the left edge of the slide stage.
- [ ] Decorative ghost number sits behind the right column, doesn't
      shift layout.
- [ ] Footer dots centered on canvas centerline.
- [ ] Active step description sits to the right of the active row at
      the same vertical midpoint.
- [ ] All v3 / v3.1 / v3.2 motion + typography rules unchanged.
- [ ] Fullscreen mode and wide-stage mode produce the same composition
      (both go through the v3.3 centered grid).

## 10. Reference images

- Target: `/spec/slides/assets/step-timeline-reference/step-timeline-target.png`
- Broken (current): `/spec/slides/assets/step-timeline-reference/step-timeline-broken.png`

## 11. Reusability

Other slide types that need a "centered composition with anchored
inner asymmetry" should adopt the same token set
(`--slide-content-max-width: 1440px`, symmetric 240px margins on a
1920px canvas). Codify in `root-spec` if a second slide type needs it.
