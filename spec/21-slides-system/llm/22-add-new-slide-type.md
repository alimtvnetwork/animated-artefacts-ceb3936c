# 22 — Add a Brand-New Slide Type (End-to-End)

> **Phase 22/22** · The minimum-viable recipe for shipping a new
> `slideType`. Every step below is required — skip any one of them and
> the deck either won't render the new slide, won't preview it in the
> grid, or won't validate at JSON-load time. Cross-reference:
> `01-architecture-and-files.md` for file ownership, `06-json-authoring-cheatsheet.md`
> for the JSON shape, `21-click-reveal-and-hotspots.md` for interaction
> wiring (if your slide reveals into another).

If your idea fits an **existing** slide type, stop and use that. New
types are reserved for layouts none of the existing types can express
(verified by re-reading `02-step-system-complete.md` §2 and file 06).

---

## 1. The 8-step contract (run in order)

| # | File | What you change |
|---|------|-----------------|
| 1 | `src/slides/enums.ts` | Add the new key to `SlideType`. |
| 2 | `src/slides/types.ts` | Extend `SlideContent` with any new fields the type consumes. |
| 3 | `src/slides/types/<NewSlide>.tsx` | Create the component skeleton (template below). |
| 4 | `src/slides/SlideStage.tsx` | Add a `case` in `SlideBody`'s switch. |
| 5 | `src/slides/components/SlidePreview.tsx` | Add the same `case` (used by Grid + builder thumbnail). |
| 6 | `src/slides/controls/GridOverview.tsx` | Add the same `case` for the slide grid. |
| 7 | `spec/slides/llm/01-architecture-and-files.md` | Add the new file to the directory listing. |
| 8 | `spec/slides/<deck>/NN-<name>.json` + `.md` | Author one example slide that exercises the new type. |

If you skip step 1 → TypeScript won't allow the JSON literal.
If you skip step 4 → `<SlideStage>` falls through to the `TitleSlide`
default and silently renders the wrong thing.
If you skip steps 5–6 → builder + grid thumbnails go blank.

---

## 2. Step 1 — `enums.ts` diff

```diff
 export const SlideType = {
   TitleSlide: 'TitleSlide',
   ...
   SectionDividerSlide: 'SectionDividerSlide',
+  /**
+   * One-line purpose. Link to the spec file that describes it
+   * (e.g. `spec/slides/llm/22-add-new-slide-type.md`).
+   */
+  MyNewSlide: 'MyNewSlide',
 } as const;
```

The string value MUST equal the key. The value is what authors write
in JSON (`"slideType": "MyNewSlide"`).

---

## 3. Step 2 — `types.ts` content fields (only if needed)

If the new slide reuses existing `SlideContent` fields (`title`,
`subtitle`, `capsules`, etc.) skip this step. If it needs new fields:

```diff
 export interface SlideContent {
   title?: string;
   subtitle?: string;
   ...
+  /** MyNewSlide — short caption rendered under the headline. */
+  caption?: string;
+  /** MyNewSlide — accent color token. Defaults to 'gold'. */
+  accent?: CapsuleColorValue;
 }
```

Always make new fields **optional**. A field on `SlideContent` is
shared across every slide type — making it required would break every
existing slide.

---

## 4. Step 3 — minimal component skeleton

`src/slides/types/MyNewSlide.tsx`:

```tsx
import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec } from '../types';
import { titleClassFor } from '../preset';

export function MyNewSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  return (
    <div
      role="region"
      aria-label={`MyNewSlide: ${c.title ?? spec.slideName}`}
      className="relative h-full w-full overflow-hidden bg-ink"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-32 pb-20 px-[240px]">
        {c.title && (
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={titleClassFor(spec)}
          >
            {c.title}
          </motion.h1>
        )}
        {c.caption && (
          <p className="mt-6 text-cream/80 text-xl max-w-[1200px] text-center">
            {c.caption}
          </p>
        )}
      </div>
    </div>
  );
}
```

**Rules baked into the skeleton:**

- `pt-32 pb-20` reserves the brand-header / strip safe area (matches `00-fundamentals.md` §3).
- `px-[240px]` honors the 1440px centered text grid (file 07 §3).
- `bg-ink` is the canvas baseline; ambient layers (if any) mount above (file 08 §2).
- `role="region"` + `aria-label` is the file-04 a11y minimum.
- `useReducedMotion()` is consulted at the top — if your component animates anything beyond opacity, branch on `reduced`.
- Title styling goes through `titleClassFor(spec)` so `titleStyle` + `titleShimmer` JSON flags Just Work.

---

## 5. Step 4 — `SlideStage.tsx` switch diff

```diff
 function SlideBody({ slide, onCapsuleClickReveal, highlightReveal, focusRef }: BodyProps) {
   switch (slide.slideType) {
     case 'TitleSlide': return <TitleSlide spec={slide} />;
     ...
     case 'SectionDividerSlide': return <SectionDividerSlide spec={slide} />;
+    case 'MyNewSlide': return <MyNewSlide spec={slide} />;
     default: return <TitleSlide spec={slide} />;
   }
 }
```

Add the import at the top of the file alongside the other slide-type
imports.

---

## 6. Step 5 — `SlidePreview.tsx` switch diff

```diff
   switch (slide.slideType) {
     case 'TitleSlide':         return <TitleSlide spec={slide} />;
     ...
     case 'SectionDividerSlide':return <SectionDividerSlide spec={slide} />;
+    case 'MyNewSlide':         return <MyNewSlide spec={slide} />;
   }
```

`SlidePreview` is the thumbnail used by the builder + grid. If you
forget this, your slide renders fine in the live deck but appears
blank in every preview surface.

---

## 7. Step 6 — `GridOverview.tsx` switch diff

```diff
   switch (slide.slideType) {
     case 'TitleSlide':         return <TitleSlide spec={slide} />;
     ...
     case 'SectionDividerSlide':return <SectionDividerSlide spec={slide} />;
+    case 'MyNewSlide':         return <MyNewSlide spec={slide} />;
   }
```

Same diff, different file. Yes, this duplication is real — it exists
because the grid and the builder render slides at different scales and
without the focus/click-reveal wiring of `SlideBody`. **Don't try to
unify these into one switch yet** — three call-sites with three
different prop shapes is a deliberate constraint.

---

## 8. Step 7 — update the architecture index

Append one row to the directory table in `01-architecture-and-files.md`
so a future blind LLM can find your new component:

```diff
 | `src/slides/types/SectionDividerSlide.tsx` | Section divider (Brutalist big number). |
+| `src/slides/types/MyNewSlide.tsx` | <one-line purpose>. |
```

---

## 9. Step 8 — author the example slide

Create the JSON + companion MD under `spec/slides/<deck>/`:

`NN-my-new-example.json`:

```json
{
  "slideNumber": NN,
  "slideName": "my-new-example",
  "slideType": "MyNewSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "enabled": true,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "titleStyle": "cream",
  "titleShimmer": true,
  "content": { "title": "My new slide", "caption": "A new layout." }
}
```

Add `my-new-example` to `deck.json`'s `slides` array. Then re-load `/N`
and verify the slide renders. The deck loader (`manifest.ts:78`) will
throw if `slideType` or `content` is missing, so this also doubles as a
schema test.

---

## 10. Acceptance checklist

Run before PR:

- [ ] `bunx tsc --noEmit` passes (TypeScript catches the enum mismatch
      earlier than runtime).
- [ ] Direct URL `/N` renders the new slide (covers SlideStage).
- [ ] Builder thumbnail (`/builder`) renders the new slide (covers
      SlidePreview).
- [ ] Grid overview (`G` key) renders the new slide (covers
      GridOverview).
- [ ] Reduced-motion: every animation collapses to a 150ms opacity
      crossfade (file 13 §reduced-motion).
- [ ] `prefers-reduced-motion` does not silence sound (file 14 §6).
- [ ] No raw hex anywhere — every color via `hsl(var(--token))` or a
      semantic Tailwind class (file 11).
- [ ] No `transform: scale()` on text — see `45-steps-code-references.md`
      grep checks.
- [ ] Title uses `titleClassFor(spec)` so `titleStyle`/`titleShimmer`
      keep working.

If you ticked all 9 boxes, version-bump (minor) and ship.

---

## 11. Common mistakes (verbatim from past PRs)

1. **"My slide renders in the deck but is blank in the grid."** You
   updated `SlideStage` but forgot `SlidePreview` and `GridOverview`.
2. **"Type error on the JSON literal."** You added the slide-type to
   the `SlideType` const but the IDE is reading a stale build — restart
   the TS server.
3. **"Default case fires and I get a TitleSlide."** Your `case`
   string doesn't match the enum value (capitalization, missing
   `Slide` suffix, etc.).
4. **"Every existing slide broke when I added a `caption` field."**
   You made `caption` required on `SlideContent`. Make it optional.
5. **"The brand header collides with my title."** You forgot
   `pt-32 pb-20` on the slide root (see §4 skeleton).
