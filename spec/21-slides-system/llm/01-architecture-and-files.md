# 01 — Architecture & File Map

A blind LLM with only `/spec/` cannot see `.lovable/memory/`. This file
mirrors the canonical project layout so you never have to guess.

---

## 1. Top-level layout

```
.
├── public/
│   ├── sounds/                       MP3 cues (see file 03)
│   │   ├── click.mp3
│   │   ├── fade_swoosh.mp3
│   │   ├── fade_swoosh_v2.mp3        ← active whoosh asset
│   │   ├── fade_zoom.mp3
│   │   ├── swoosh.mp3                ← original (kept for variations)
│   │   └── zoom.mp3
│   └── placeholder.svg, robots.txt
├── src/
│   ├── App.tsx, main.tsx, index.css, vite-env.d.ts
│   ├── assets/
│   │   ├── brand/                    riseup-asia-logo*.png, alim-presenter.png, meeting-qr.png
│   │   ├── controller-reference/     controller-pill.png
│   │   └── sounds/                   (legacy — duplicates of /public/sounds/)
│   ├── components/ui/                shadcn — leave alone unless restyling
│   ├── pages/
│   │   ├── SlideDeckPage.tsx         /N route — main viewer
│   │   ├── PresenterPage.tsx         /present
│   │   ├── BuilderPage.tsx           /builder (form-based JSON editor)
│   │   ├── SettingsPage.tsx          /settings (preset + alignment guide toggles)
│   │   ├── StyleGuidePage.tsx        /style — color/font/capsule reference
│   │   └── Index.tsx, NotFound.tsx
│   ├── builder/                      Builder UI (form-based slide editor)
│   └── slides/                       SLIDE SYSTEM (see §2)
├── spec/
│   ├── architecture/                 high-level architecture notes
│   ├── audit/                        audit reports (gap analyses)
│   ├── issues/                       open bug reports
│   └── slides/
│       ├── *.md                      historical specs 00 → 41
│       ├── slide.schema.json         JSON schema for one slide
│       ├── deck.schema.json          JSON schema for deck.json
│       ├── deck-manifest.schema.json portable export schema
│       ├── assets/                   per-spec reference screenshots
│       ├── showcase/                 the bundled deck (one folder per deck)
│       │   ├── deck.json
│       │   ├── NN-name.json          ← runtime source of truth
│       │   └── NN-name.md            ← human design note
│       └── llm/                      THIS INSTRUCTION PACK (read first)
│           ├── 00-README.md
│           ├── 01-architecture-and-files.md (this file)
│           ├── 02-step-system-complete.md
│           ├── 03-sound-system-complete.md
│           ├── 04-ambient-and-title-background.md
│           ├── 05-design-tokens-and-theme.md
│           ├── 06-json-authoring-cheatsheet.md
│           └── assets/               reference screenshots, mirrored
├── front-end/themes/noir-gold/       theme token JSON (colors.json, themes.json)
├── front-end/slide-template/         per-slide-type JSON templates
└── php/                              backend placeholder (not active)
```

---

## 2. `src/slides/` — the slide system

| File | Owns |
|------|------|
| `enums.ts` | `SlideType`, `SlideTransition`, `TextAnimation`, `CapsuleColor`, `ControllerPosition` |
| `types.ts` | `SlideSpec`, `StepSpec`, `CapsuleSpec`, `ContactRow`, `BrandStripSpec`, `MeetingSpec`, `DeckSpec`, `SlideSoundSpec`, `AmbientBackgroundSpec` |
| `loader.ts` | Resolves `spec/slides/{deck}/*.json` via `import.meta.glob` + handles localStorage-imported manifests |
| `themes.ts` | `THEMES`, `applyTheme(id)`, `getStoredTheme()`, `setTheme(id)` |
| `preset.ts` | `titleClassFor()`, deck-wide preset rules (Ubuntu, clamp sizing) |
| `presetSettings.ts` | `/settings` page persistent prefs (alignment guide toggle, step panel feel, body grid mode) |
| `slideGuideOverrides.ts` | per-slide guide-set selector (logo / body / rail / all / none) |
| `guidePositions.ts` | live x-coords from `SlidePreviewAlignmentOverlay` → editor (snap-to-guide) |
| `sound.ts` | `slideSound` singleton (see file 03) |
| `transitions.ts` | per-`SlideTransition` Framer variants |
| `textAnimations.ts` | per-`TextAnimation` Framer variants + the `cinematicCapsules` preset |
| `manifest.ts` | export/import portable `.json` manifests |
| `meeting.ts` | resolves QR URL/label from deck + slide |
| `preload.ts` | image / sound prefetch on first idle |
| `sync.ts` | `BroadcastChannel` between deck ↔ presenter view |
| `ambientPresets.ts` | `devtools / productivity / process / minimal` icon sets |
| `SlideStage.tsx` | Wraps every slide. Owns `AnimatePresence`, ambient mount, brand chrome |
| `components/AmbientBackground.tsx` | Reusable ambient icon constellation (see file 04) |
| `components/BrandHeader.tsx` | Top-left wordmark + presenter chip |
| `components/BrandStrip.tsx` | Optional 36px deck-wide top strip |
| `components/Capsule.tsx` | Capsule with hover label-flip + expand-card |
| `components/BrandedQR.tsx` | Branded QR for `QrMeetingSlide` |
| `components/AlignmentGuideOverlay.tsx` | Live HUD: logo / body / rail guides |
| `components/SlidePreviewAlignmentOverlay.tsx` | Same overlay, scaled into preview thumbs |
| `components/HotspotLayer.tsx` | Free-floating click-reveal regions |
| `components/ClickRevealBadge.tsx` | "Hidden detail · Back to N" pill |
| `controls/ControllerBar.tsx` | Bottom-center pill (hover-reveals) |
| `controls/DeckMenu.tsx` | Manifest import/export + reset |
| `controls/DotPagination.tsx` | Tiny dot indicator next to controller |
| `controls/GridOverview.tsx` | Press `G` overview |
| `controls/ThemeMenu.tsx` | Live theme switcher |
| `controls/SlideIndicator.tsx`, `SlideNumberBadge.tsx`, `TopSlideJumper.tsx`, `ShareMenu.tsx` | Smaller chrome bits |
| `hooks/useFocusTimeline.ts` | `tryAdvance(direction): boolean` contract used by FocusTimelineSlide / AdvanceStepSlide / StepTimelineSlide |
| `types/{SlideType}.tsx` | One renderer per slide type. **Add a new file here when adding a new slide type.** |

---

## 3. Minimum file set when adding a new slide type

If a user asks for a brand-new slide type called `ExampleSlide`:

| File | What to add |
|------|-------------|
| `src/slides/enums.ts` | Add `ExampleSlide: 'ExampleSlide'` to `SlideType` |
| `src/slides/types.ts` | Extend `SlideSpec`/`SlideContent` if it needs new fields |
| `src/slides/types/ExampleSlide.tsx` | Renderer. Default export. Receives `{ spec: SlideSpec }`. |
| `src/slides/SlideStage.tsx` | Add a `case SlideType.ExampleSlide:` that returns `<ExampleSlide spec={spec} />` |
| `spec/slides/slide.schema.json` | Add `"ExampleSlide"` to `slideType.enum`. Document the new content fields. |
| `spec/slides/llm/06-json-authoring-cheatsheet.md` | Add a copy-paste template. |
| `spec/slides/{deck}/NN-example.json` + `.md` | A real instance in a deck. |
| `spec/slides/{deck}/deck.json` | Add `"NN-example"` to `slides[]`. |
| `front-end/slide-template/ExampleSlide.json` | Optional reusable template. |
| `package.json` | Bump version (minor when adding a new slide type, patch otherwise). |
| `.lovable/memory/index.md` | Append to "Memories" if it introduces a reusable design pattern. |

---

## 4. Minimum file set when adding a new slide *instance* (existing type)

| File | What to add |
|------|-------------|
| `spec/slides/{deck}/NN-name.json` | The slide JSON (validated by `slide.schema.json`). |
| `spec/slides/{deck}/NN-name.md` | One-paragraph design note. |
| `spec/slides/{deck}/deck.json` | Insert `"NN-name"` into `slides[]` at the right position. |
| `package.json` | Bump patch. |

That's it — no React changes, no schema changes.

---

## 5. Where the screenshots live

| Subject | Path |
|---------|------|
| StepTimeline target | `spec/slides/llm/assets/step/target.png` |
| StepTimeline broken (anti-pattern) | `spec/slides/llm/assets/step/broken-reference.png` |
| Controller pill | `spec/slides/llm/assets/controller/controller-pill.png` |
| Riseup Asia logo | `spec/slides/llm/assets/title/riseup-asia-logo.png` |
| Presenter avatar | `spec/slides/llm/assets/title/presenter.png` |

If you commit a new design reference, mirror it under
`spec/slides/llm/assets/{topic}/` so the LLM-pack stays self-contained.
