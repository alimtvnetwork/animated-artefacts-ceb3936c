# 25 — JSON vs MD Companion Contract

> **Phase 25/25** · The split of responsibility between a slide's JSON
> spec (machine source of truth) and its MD companion (blind-AI brief).
> When a contributor — human or LLM — asks "what goes where?", this is
> the single answer. Enforced by `src/test/spec-parity.test.ts`.

## The two-file rule

Every slide in `spec/slides/{deck}/` ships as a **pair**:

```
NN-slide-name.json    ← runtime source of truth (rendered by the app)
NN-slide-name.md      ← human/AI-readable brief (never read at runtime)
```

The JSON drives the UI. The MD lets a future presenter, designer, or a
blind LLM (no preview, no screenshots) understand *why* the slide exists
and *what it should look like*. Both must agree on identity fields —
drift is a CI-failing bug, not a stylistic preference.

## What MUST be in the JSON

These fields are required by `src/slides/contracts.ts` (zod) and by
`spec/slides/slide.schema.json` (Ajv discriminator). Missing or wrong-typed
fields fail fast at boot with the slide number, name, and JSON path.

### Envelope (every slide)

| Field | Type | Notes |
|---|---|---|
| `slideNumber` | int > 0 | Unique within the deck. |
| `slideName` | string | kebab-case identifier (also drives the file name). |
| `slideType` | enum | One of the 11 SlideType values; drives the discriminator. |
| `transition` | enum | `FadeIn` / `SlideIn` / `PushIn` / `PushLeft` / `PushRight`. |
| `textAnimation` | enum | `Bounce` / `FadeIn` / `SlideUp` / `Stagger`. |
| `isClickReveal` | bool | `true` excludes the slide from linear flow + indicators. |
| `showBrandHeader` | bool | Default true; false for full-bleed art slides. |
| `showPresenterChip` | bool | Default true; turn off for "Meet the team" interludes. |

### Per-type required `content`

See `spec/slides/llm/23-slide-type-contracts.md` for the full table. At a
glance: `TitleSlide` needs `title`; `KeywordSlide` needs `title` +
`keywords[≥3]`; `StepTimelineSlide` needs `title` + `steps[3..6]`;
`MetricGridSlide` needs `title` + `metrics[2..6]`; `QrMeetingSlide` needs
one of `meetingUrl|qrUrl|qrAsset`.

### Optional but JSON-only (never put these in MD)

These are runtime knobs the renderer reads. Authoring them in MD has no
effect — the app does not parse Markdown.

- `enabled: false` — keep the slide in the pack but exclude from the deck.
- `parentSlide: N` — required for click-reveal slides.
- `titleStyle`, `titleShimmer`, `titleAmbient`, `stepAmbient`,
  `headerOffsetPx`, `leftOffsetPx`, `rightOffsetPx`, `topOffsetPx`,
  `iconPool`, `positions[]`, `accents`, `floatIndexes`, `glow`, `cta`,
  `expand`, `hotspots[]`, `webcam`, `notes`.

## What MUST be in the MD

The MD is a **blind brief** — assume the reader has never seen the deck
and cannot run the app. Required header block (parsed by
`src/test/spec-parity.test.ts`):

```md
# NN — Human-Readable Title

- **Type:** {slideType}              ← MUST equal JSON `slideType`
- **Transition:** {transition}        ← MUST equal JSON `transition`
- **Text animation:** {textAnimation} ← MUST equal JSON `textAnimation`
- **Theme:** Noir & Gold              ← deck-wide constant; restate for portability
- **Purpose:** One-line "why this slide exists".
- **Visual:** One-line "what the audience sees".
```

The parity test tokenises each `- **Field:** value` line and rejects
mismatches with a message like:

```
spec parity — MD ↔ JSON drift detected:
  03-process: MD "Transition" = "FadeIn" but JSON = "SlideIn"
```

### Optional but encouraged in MD

Any extra prose under the header block is preserved verbatim and is the
right home for design intent that has no machine equivalent:

- **`## Notes`** — what the presenter says aloud while this slide is up.
- **`## Typography rules`** — why a particular `titleStyle` was picked.
- **`## Active-step animation`** — narrative description of staged motion.
- **`## Ambient layer`** — why specific icons sit at specific coordinates
  (used as the design rationale for the JSON `positions[]` block — see
  `03-process.md` for the canonical example).
- **`## Header offset`** — explanation of any pixel nudges
  (`headerOffsetPx`, `leftOffsetPx`).
- **`## Reusability`** — when the same pattern shows up elsewhere.

## What MUST NOT be in either file

- **Hex colors in JSON** — use the registered slug (`accent: "#007ACC"`
  is OK ONLY for brand-mark icons that have an authoritative external
  color; everything else must come from the theme tokens via the
  renderer).
- **Long prose in JSON** — the deck rule is keyword-first content. Body
  copy belongs in the MD `## Notes` section, not in `content.subtitle`.
- **Layout instructions in MD** — coordinates, opacity, drift, parallax
  are JSON-only. MD describes the *design intent* ("VS Code top-right,
  GitHub mid-bottom with ~22% horizontal gap"), JSON encodes the
  *coordinates* (`top: 22, left: 78`).
- **Lovable-app branding** anywhere — no logos, favicons, og-tags, meta
  references in either file.

## Contributor checklist

Use this when adding or editing a slide. The first three items are
machine-checked by `bunx vitest run src/test/spec-parity.test.ts`.

- [ ] **Pair exists.** `NN-slide-name.json` AND `NN-slide-name.md` both
  live in the same `spec/slides/{deck}/` folder.
- [ ] **Identity fields agree.** MD's `Type`, `Transition`, `Text animation`
  match the JSON character-for-character (token compare; punctuation in
  parentheses is allowed).
- [ ] **JSON passes the runtime contract.** `validateSlide(json).ok ===
  true`. Run the test or import in a REPL — do not eyeball.
- [ ] **Per-type required fields present.** Cross-check against
  `spec/slides/llm/23-slide-type-contracts.md` table.
- [ ] **No app-side fallback** unless intentional. Slides that author
  `titleAmbient` / `stepAmbient` are JSON-driven; slides that omit them
  inherit `HOME_ICONS` / `STEP_AMBIENT_POOL` defaults — the
  spec-parity test logs an advisory `console.warn` listing every slide
  that does so. Acceptable for legacy decks; new slides should declare
  the block explicitly so they survive being copied into another deck.
- [ ] **All ambient icon slugs resolve.** Every slug in
  `titleAmbient.iconPool`, `stepAmbient.iconPool`, and `positions[].icon`
  must exist in `src/slides/ambientIconRegistry.ts`. The parity test
  fails if any slug is unknown.
- [ ] **MD purpose + visual lines are non-empty.** A blind reader (no
  preview) can paraphrase what the audience would see and why.
- [ ] **Click-reveal slides set `parentSlide`** and the parent slide
  has at least one capsule with a matching `clickRevealSlide`.
- [ ] **Theme constants are stated, not assumed.** Even though the deck
  is always Noir & Gold today, write `**Theme:** Noir & Gold` so the MD
  is portable into a future multi-theme deck.
- [ ] **Version bumped** at minimum minor when adding a new slide
  (project rule: code changes must bump at least minor).

## Why two files instead of one

A single JSON or single MD would force one of two compromises:

1. **JSON-only** — the schema bloats with `description`, `rationale`,
   `presenterNotes`, `designIntent` fields the renderer never reads, and
   the spec becomes hostile to humans skimming for design decisions.
2. **MD-only** — the renderer would need a Markdown parser at boot, the
   contract surface explodes, and validation becomes "did the author
   spell `**Transition**` correctly?" instead of "is this string an
   enum value?".

Splitting them keeps both clean: the JSON is the strict, validated,
machine-checkable contract; the MD is the prose the next presenter or
LLM reads to understand the slide. The parity test is the bridge that
prevents them from drifting.

## Where this contract is enforced

| Layer | File | What it catches |
|---|---|---|
| IDE / authoring | `spec/slides/slide.schema.json` (Ajv) | Wrong field types, missing required fields, bad enum values. |
| Runtime / boot | `src/slides/contracts.ts` (zod) | Same as above, with per-slide failure messages naming the slide number. |
| CI / tests | `src/test/spec-parity.test.ts` | Missing MD companions, MD↔JSON identity drift, unknown ambient icon slugs, advisory log of slides relying on app-side fallbacks. |
| Strict gate | `assertValidSlides()` | Throws on first failing slide — wire into a pre-deploy script when needed. |

When in doubt, run `bunx vitest run` — 19 tests, all four layers, ~3
seconds end-to-end.
