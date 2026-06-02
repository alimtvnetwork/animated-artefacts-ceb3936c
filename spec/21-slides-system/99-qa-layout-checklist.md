# Slide Layout QA Checklist

> **When to run:** before merging any change that touches slide chrome, brand
> header, step rails, or per-row spacing. Takes ~2 minutes per slide.
> **Where it lives:** linked from the Builder editor sidebar (`?qa=layout`)
> and from `spec/readme.md` § Authoring workflow.

## 1. Logo / brand inset (every slide with `showBrandHeader: true`)

- [ ] **Left edge of "R"** in the wordmark sits at `var(--brand-inset-x)` from
      the viewport left edge. On 1920px canvas → 288px. On 1280px → 192px.
- [ ] **Presenter chip right edge** mirrors the same inset on the right.
- [ ] Logo height is `h-[54px]` (trimmed PNG). Never `h-16`.
- [ ] Logo **does not overlap** the slide title or eyebrow on any viewport
      (mobile 390, tablet 820, desktop 1440, large 1920).
- [ ] If the user reports the logo is "covered by something" in fullscreen,
      check it's not the **browser's native fullscreen banner** (OS chrome,
      not a layout bug — disappears after ~2s).
- [ ] Toggle `Settings → Alignment guide ON`. Gold (logo) and cream (body)
      dashed lines must overlap with `Δ: 0px ✓` in the HUD.

## 2. Step rail / chain layout (StepsChain3DSlide, StepTimelineSlide)

- [ ] Vertical rail sits **past the right edge of the marker** with at least
      `8px` clearance. Never slices through the marker digit.
- [ ] Step text column **starts past the rail** with at least `8px`
      clearance. Never overlaps the rail.
- [ ] Geometry derives from the layout token (`content.layout.markerSize`,
      `railOffset`, `textGap` for `StepsChain3DSlide` — see CR 25). No
      hardcoded `left: 28px` or `gap-5` on the chain row.
- [ ] Run the responsive vitest:
      `bunx vitest run src/test/stepsChain3DResponsiveLayout.test.tsx`.
      All 6 cases must pass (mobile / tablet / desktop / large + custom +
      clamp).

## 3. Overlap rules (universal)

- [ ] No two text blocks overlap. Use `flex items-center gap-N` or grid,
      never absolute-positioned text on top of other text.
- [ ] Capsules wrap (not clip) on narrow screens (`flex-wrap`).
- [ ] Right description panel (col-span-5 on slide 4) does not bleed into
      the left chain column at viewport widths ≥ 1024px.
- [ ] Ghost numeral (`#F3A502 @ 20%`) sits **behind** the description panel
      text — `pointer-events-none` + `z-index` below the text z-index.
- [ ] Controller pill at `BottomCenter` does not overlap the bottom-most
      slide content at any viewport.

## 4. Tokens / theming

- [ ] No raw hex in components. Use semantic tokens: `hsl(var(--gold))`,
      `hsl(var(--ember))`, `hsl(var(--cream))`, `hsl(var(--ink))`.
- [ ] Light text uses semantic classes (`.slide-title-display`,
      `.slide-eyebrow`, `.step-title`) — never inline `text-shadow`.
- [ ] Theme swap (light ↔ dark) keeps brand inset and rail position
      unchanged.

## 5. Verification matrix

| Viewport | Path | Expected |
|----------|------|----------|
| 390×844 (iPhone) | `/4` | Rail past marker; text past rail; logo visible |
| 820×1180 (iPad) | `/4` | Same as above |
| 1280×720 (laptop) | `/4` | Right description panel visible; ghost "01" |
| 1920×1080 (canvas) | `/4` | Brand inset = 288px; full design |

## 6. When something looks off — root cause first

The user has explicitly required: **write the RCA before applying the fix**.
Pattern:

1. Read the screenshot. Identify the exact element that's misplaced.
2. Read the relevant component file. Note the literal pixel values.
3. State the root cause in one paragraph: which value, which file, why it
   produces the visible bug.
4. Propose the fix as a diff hunk.
5. Wait for "go" before editing.
6. After the fix: take a fresh screenshot at the same viewport and compare.

---

## Linked from

- `src/builder/SlideListSidebar.tsx` — "QA layout" link in the sidebar
  footer opens this file in a new tab via `?qa=layout`.
- `spec/readme.md` § Authoring workflow — step 5 ("review layout") links
  here.
- `spec/22-slides-issues/25-steps-3d-layout-knobs.md` — the layout config
  this checklist depends on.
