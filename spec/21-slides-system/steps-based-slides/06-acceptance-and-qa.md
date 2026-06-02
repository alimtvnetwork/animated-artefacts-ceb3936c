# 06 — Acceptance & QA

A step-based slide is "done" only when ALL of the following hold. Treat this as
the definition-of-done gate for the outline section and its siblings.

## Functional acceptance

- [ ] Renders purely from `spec.content`; no hardcoded copy.
- [ ] Requires `title` + `items` (2–8). Renders gracefully (no crash) if
      optional fields are absent.
- [ ] Index labels are 1-based, two-digit (`01`…`08`), `tabular-nums` aligned.
- [ ] `activeIndex` highlights exactly one row (full-gold glowing numeral, row
      opacity 1) and dims all others to 0.55; omitting it shows all rows equal.
- [ ] `capsule` renders a colored pill; `meta` renders a `.capsule-meta` tag;
      both-present renders capsule then meta.

## House-rule acceptance

- [ ] **No `text-white` / `text-black` literals** for slide copy — only
      `text-[hsl(var(--white)/…)]` / semantic classes. (`hardcodedWhiteAudit`
      test passes.)
- [ ] **No inline brand-token pill styles** — capsules go through `<Capsule>` /
      `.capsule-{tone}` / `.capsule-meta` only.
- [ ] **No inline `text-shadow`** on `.step-title` / `.slide-eyebrow` /
      `.slide-title-content` — the weight-shadow tokens handle it.
- [ ] Horizontal edges read from `--brand-inset-x`; top from `--brand-inset-y`.
- [ ] Titles/subtitles are keywords-only (no paragraphs).

## Theme acceptance (the real test)

- [ ] Dark (default Noir & Gold): gold accents, white titles, visible hairline.
- [ ] `paper-ink` light theme: titles/subtitles become dark ink and stay
      legible; capsules keep contrast; nothing collapses to invisible.
- [ ] `github-light`: same.

## Motion acceptance

- [ ] Items stagger in top-to-bottom on entrance.
- [ ] `prefers-reduced-motion`: entrance is an opacity-only crossfade; no
      looping/continuous animation runs.
- [ ] Active-row crossfade is ≤ ~240ms opacity; nothing animates position on the
      static outline.

## Density acceptance (1080px budget)

- [ ] header (~header block + mb-12) + N rows + bottom inset ≤ 1080px.
- [ ] 8 rows is the hard max; if content needs more, it's split across slides,
      not shrunk.

## Automated gates

```bash
bun run lint                                   # 0 errors
bun run test src/test/slideFixtures.test.ts    # fixture present for the type
bun run test src/test/hardcodedWhiteAudit.test.ts
bun run test                                   # full suite green
bun run build                                  # clean
```

## Manual QA (visual)

Open the slide in the preview at `/{slideNumber}`, then:
1. Confirm alignment of eyebrow / title / first index numeral on the
   `--brand-inset-x` axis.
2. Toggle `activeIndex` values and watch the glow + dim move correctly.
3. Flip through all themes via the controller/import dialog.
4. Toggle reduced motion (OS setting or the controller dropdown) and re-enter.

Only after every box is checked is the slide ready to ship.
