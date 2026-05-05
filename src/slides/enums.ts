export const SlideType = {
  TitleSlide: 'TitleSlide',
  /**
   * Section-break / interlude slide ("Ideas to share" moment). Dark slate
   * + warm amber spotlight + scattered ambient icons; only renders title +
   * optional eyebrow + optional subtitle. See `spec/slides/26-middle-title-slide.md`.
   */
  MiddleTitleSlide: 'MiddleTitleSlide',
  KeywordSlide: 'KeywordSlide',
  CapsuleListSlide: 'CapsuleListSlide',
  StepTimelineSlide: 'StepTimelineSlide',
  /**
   * Cinematic 3D chain of steps. Active step forward (Scale 1.0/Z 0); ±1
   * recede (0.85/-60px/0.5px blur); ≥±2 distant (0.7/-140px/1.2px blur).
   * Spring-driven WAAPI (damping 14, stiffness 180, mass 1) — no layout
   * property animation, no solid active background. Marker bubbles up
   * +80ms after card settles; chain rotateX 0→4°→0 for revolver feel.
   * prefers-reduced-motion → opacity crossfade. Preserves slideSound.
   * See `spec/slides/61-steps-chain-3d.md`.
   */
  StepsChain3DSlide: 'StepsChain3DSlide',
  /**
   * Carousel-of-one timeline. One step in the limelight (full color, with
   * description); neighbors dim and shrink. Advances on the deck's Next/Prev
   * controls — presenter-paced, NOT auto-loop. See `spec/slides/11-focus-timeline.md`.
   */
  FocusTimelineSlide: 'FocusTimelineSlide',
  /**
   * Cinematic camera-zoom step chain. Vertical reel of full-viewport step
   * frames; Next/Prev dollies the camera. Owns navigation via `tryAdvance`.
   * See `spec/slides/18-advance-step-cinematic.md`.
   */
  AdvanceStepSlide: 'AdvanceStepSlide',
  ImageSlide: 'ImageSlide',
  QrMeetingSlide: 'QrMeetingSlide',
  ClickRevealSlide: 'ClickRevealSlide',
  SectionDividerSlide: 'SectionDividerSlide',
  /**
   * Compact grid of headline metrics — big number + label + optional caption
   * per cell. 2-6 cells, auto-laid out (1xN, 2x2, or 2x3 depending on count).
   * Use for proof-of-impact slides ("3M users · 99.9% uptime · $4.2M ARR").
   * See `spec/slides/llm/22b-metric-grid-worked-example.md`.
   */
  MetricGridSlide: 'MetricGridSlide',
  /**
   * Comparison table — title + columns + rows with per-row accent bars.
   * Use for "X versus Y" decks (frameworks, plans, vendors). v0.169.
   * See `spec/slides/59-generic-slide-types.md`.
   */
  TableSlide: 'TableSlide',
  /**
   * Code block — title + a single hero `.slide-codeblock`. Highlights via
   * shiki, manual token array, or plain text. Topic-agnostic. v0.169.
   */
  CodeBlockSlide: 'CodeBlockSlide',
  /**
   * Generic boxes-with-fields diagram (ER-style, but topic-agnostic). Inline
   * SVG, optional 4/8 split with explanation. v0.169.
   */
  BoxDiagramSlide: 'BoxDiagramSlide',
  /**
   * Entity-relationship diagram with automatic navy-blue palette (cyan PK,
   * orange FK, blue connectors). Same data shape as `BoxDiagramSlide` —
   * accepts `entities`/`relationships` (preferred) or `diagramNodes`/
   * `diagramEdges` (compat). v0.177.
   */
  ERDiagramSlide: 'ERDiagramSlide',
  /**
   * Generic layout wrapper — picks one of the `.slide-grid-*` presets and
   * renders `layoutSlots[]` as cells (cards / plain text / inline codeblocks).
   * Use this when no specialised slide type fits and the deck just needs a
   * 5/7 split, 4/8 split, 2-equal compare, 2x3 card grid, or centered hero. v0.169.
   */
  LayoutSlide: 'LayoutSlide',
  /**
   * Addendum 29 §2.1 — single ER diagram. ≤5 entities, ≤6 relationships.
   * Theme-token SVG renderer (Mermaid swap pending).
   */
  DatabaseDiagramSlide: 'DatabaseDiagramSlide',
  /**
   * Addendum 29 §2.2 — narrow-idea sibling of `TableSlide`. ≤5 columns × ≤8 rows.
   * Header at 0.25s, rows Stagger 35ms.
   */
  DataTableSlide: 'DataTableSlide',
  /**
   * Addendum 29 §2.3 — exactly ONE animated number. Easings: linear /
   * easeOutQuint / spring. Reduced-motion → snap.
   */
  NumberCalloutSlide: 'NumberCalloutSlide',
  /**
   * Addendum 29 §2.4 — exactly ONE equation, term-by-term Stagger.
   * Build-time KaTeX prerender pending; falls back to whitespace tokens.
   */
  EquationSlide: 'EquationSlide',
  /**
   * Spec 62 — audience-facing checklist. Click rows to confirm done; gold
   * progress bar tracks completion. Resolves ambiguity #32. ≤7 items.
   */
  ChecklistSlide: 'ChecklistSlide',
  /**
   * TileSlide — N (2–4) clickable cards in a row. Each tile = glyph + name +
   * tag + desc + external URL. Used for project lists / repo galleries.
   * See `updates/spec/05-tile-slide.md`.
   */
  TileSlide: 'TileSlide',
  /**
   * BlastRadiusSlide — cinematic single-word title moment. Chrome gradient
   * title + tumbling SVG shards + drifting particle field + radial vignette.
   * Pairs with the `ZoomOut` exit transition: the whole stage scales 1.0→1.18
   * and fades over 600ms (expoIn) so the next slide feels like it arrives
   * from behind the title. Required: `content.title`. See
   * `spec/26-slide-definitions/_patterns/blast-radius-slide.md`.
   */
  BlastRadiusSlide: 'BlastRadiusSlide',
  /**
   * SessionOutlineSlide — vertical numbered agenda. Title block on top, then
   * a list of 2–8 outline rows (big index numeral · title · subtitle · meta
   * capsule). Optional `activeIndex` highlights one row (e.g. "we are here").
   * Use as a session/chapter outline page; pairs with BlastRadiusSlide as a
   * chapter opener. See `spec/26-slide-definitions/_patterns/session-outline-slide.md`.
   */
  SessionOutlineSlide: 'SessionOutlineSlide',
} as const;
export type SlideTypeValue = typeof SlideType[keyof typeof SlideType];

export const SlideTransition = {
  FadeIn: 'FadeIn',
  SlideIn: 'SlideIn',
  PushIn: 'PushIn',
  PushLeft: 'PushLeft',
  PushRight: 'PushRight',
  /**
   * ZoomOut — the cinematic outro paired with `BlastRadiusSlide`. On exit
   * the stage scales 1.0→1.18 + fades + 4px blur over 600ms (expoIn). The
   * entrance leg falls back to a fast scale-down + fade so it stays usable
   * if any other slide opts in. See `spec/26-slide-definitions/_patterns/blast-radius-slide.md` §8.
   */
  ZoomOut: 'ZoomOut',
} as const;
export type SlideTransitionValue = typeof SlideTransition[keyof typeof SlideTransition];

export const TextAnimation = {
  FadeIn: 'FadeIn',
  Bounce: 'Bounce',
  SlideUp: 'SlideUp',
  Stagger: 'Stagger',
} as const;
export type TextAnimationValue = typeof TextAnimation[keyof typeof TextAnimation];

export const CapsuleColor = {
  Gold: 'gold',
  Ember: 'ember',
  Cream: 'cream',
  Ink: 'ink',
  Outline: 'outline',
  // v0.25 — vibrant accent variants for multi-capsule slides that need
  // chromatic variety beyond gold + ember (e.g. Capabilities).
  Violet: 'violet',
  Teal: 'teal',
  Rose: 'rose',
  Sky: 'sky',
} as const;
export type CapsuleColorValue = typeof CapsuleColor[keyof typeof CapsuleColor];

export const ControllerPosition = {
  BottomCenter: 'BottomCenter',
  TopRight: 'TopRight',
} as const;
