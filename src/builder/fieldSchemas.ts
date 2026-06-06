/**
 * Per-slideType form field schemas for the in-app slide builder.
 *
 * Each entry declares which `SlideContent` fields the form renders for a given
 * slide type, plus sensible defaults so a freshly-picked slide type always
 * produces a valid preview without the author touching anything.
 *
 * Adding a new slide type:
 *   1. Add an entry here keyed by the `SlideTypeValue`.
 *   2. Pick which content fields the type cares about.
 *   3. Provide a `defaults` block that yields a usable preview on first render.
 */
import type { SlideTypeValue } from '../slides/enums';
import type { SlideContent, SlideSpec } from '../slides/types';

export type FieldKey =
  | 'eyebrow'
  | 'title'
  | 'subtitle'
  | 'keywords'
  | 'capsules'
  | 'steps'
  | 'image'
  | 'meetingUrl'
  | 'meetingLabel'
  | 'qrStyle'
  | 'contactRows'
  | 'cta'
  | 'socials'
  | 'direction'
  | 'windowSize'
  | 'metrics'
  | 'tableColumns'
  | 'tableRows'
  | 'code'
  | 'codeLanguage'
  | 'diagramNodes'
  | 'diagramEdges'
  | 'diagramExplanation'
  | 'entities'
  | 'relationships'
  | 'layout'
  | 'layoutSlots';

export interface SlideTypeSchema {
  /** Display label for the type picker. */
  label: string;
  /** One-line summary shown under the picker. */
  blurb: string;
  /** Fields the form should render for this slide type, in display order. */
  fields: FieldKey[];
  /** Starter content used when the user picks this type for the first time. */
  defaults: Partial<SlideContent>;
  /** Slide-level defaults beyond `content` (e.g. brand-strip toggles for hero slides). */
  slideDefaults?: Partial<Omit<SlideSpec, 'slideNumber' | 'slideName' | 'slideType' | 'content'>>;
}

export const SLIDE_TYPE_SCHEMAS: Record<SlideTypeValue, SlideTypeSchema> = {
  TitleSlide: {
    label: 'Title',
    blurb: 'Hero opener. Eyebrow + headline + subtitle, white title under premium preset.',
    fields: ['eyebrow', 'title', 'subtitle', 'capsules'],
    defaults: {
      eyebrow: 'INTRODUCING',
      title: 'A Bold New Direction',
      subtitle: 'A short presenter-narration anchor sentence.',
    },
    slideDefaults: { showBrandHeader: false, showPresenterChip: false, brandStrip: false },
  },
  // Section-break / interlude. Same shape as TitleSlide minus capsules — the
  // whole point of this type is "calm down, here's the next idea". See
  // `spec/slides/26-middle-title-slide.md`.
  MiddleTitleSlide: {
    label: 'Middle Title',
    blurb: 'Section-break interlude. Spotlight + ambient icons; gold title + gray subtitle only.',
    fields: ['eyebrow', 'title', 'subtitle'],
    defaults: {
      title: 'Meet the Team',
      subtitle: 'The People Behind the Results',
    },
    slideDefaults: { showBrandHeader: true, showPresenterChip: false, brandStrip: false },
  },
  KeywordSlide: {
    label: 'Keyword',
    blurb: 'Title + a row of keyword tokens. Use for vocabulary moments.',
    fields: ['eyebrow', 'title', 'subtitle', 'keywords'],
    defaults: {
      eyebrow: 'WHAT WE DO',
      title: 'Three Words',
      keywords: ['Strategy', 'Design', 'Engineering'],
    },
  },
  CapsuleListSlide: {
    label: 'Capsule List',
    blurb: 'Title + colored capsule labels. Default body slide for grouped offerings.',
    fields: ['eyebrow', 'title', 'subtitle', 'capsules'],
    defaults: {
      eyebrow: 'CAPABILITIES',
      title: 'What We Deliver',
      capsules: [
        { text: 'Brand Systems', color: 'gold' },
        { text: 'Product Design', color: 'cream' },
        { text: 'Front-End Build', color: 'ember' },
      ],
    },
  },
  StepTimelineSlide: {
    label: 'Step Timeline',
    blurb: 'Numbered step rail. All steps visible at full opacity.',
    fields: ['eyebrow', 'title', 'subtitle', 'steps'],
    defaults: {
      eyebrow: 'OUR PROCESS',
      title: 'Four Phases',
      steps: [
        { label: '01', title: 'Discover', subtitle: 'Listen and align' },
        { label: '02', title: 'Design',   subtitle: 'Shape and prototype' },
        { label: '03', title: 'Deliver',  subtitle: 'Ship and measure' },
        { label: '04', title: 'Iterate',  subtitle: 'Refine over time' },
      ],
    },
  },
  StepsChain3DSlide: {
    label: 'Steps Chain 3D',
    blurb: 'Cinematic 3D chain. Active step forward; siblings recede with depth + blur. No active background fill.',
    fields: ['eyebrow', 'title', 'subtitle', 'steps'],
    defaults: {
      eyebrow: 'OUR PROCESS',
      title: 'Step Into Focus',
      steps: [
        { label: '01', title: 'Discover', subtitle: 'Listen and align' },
        { label: '02', title: 'Design',   subtitle: 'Shape and prototype' },
        { label: '03', title: 'Deliver',  subtitle: 'Ship and measure' },
        { label: '04', title: 'Iterate',  subtitle: 'Refine over time' },
      ],
    },
  },
  FocusTimelineSlide: {
    label: 'Focus Timeline',
    blurb: 'Carousel-of-one timeline. Focused step is bright; siblings dim.',
    fields: ['eyebrow', 'title', 'subtitle', 'steps', 'direction', 'windowSize'],
    defaults: {
      eyebrow: 'JOURNEY',
      title: 'Step Through',
      direction: 'horizontal',
      windowSize: 3,
      steps: [
        { label: '01', title: 'Listen',    description: 'Workshops, audits, interviews.' },
        { label: '02', title: 'Synthesize', description: 'Patterns become a brief.' },
        { label: '03', title: 'Build',     description: 'Design and code, in sync.' },
      ],
    },
  },
  AdvanceStepSlide: {
    label: 'Advance Step (Cinematic)',
    blurb: 'Camera-zoom step chain. Vertical reel, one frame in focus, dollies between steps. Owns Next/Prev.',
    fields: ['eyebrow', 'title', 'subtitle', 'steps'],
    defaults: {
      eyebrow: 'HOW WE WORK',
      title: 'Engagement, in motion',
      steps: [
        { label: 'Step 1', title: 'Discovery', subtitle: 'Two weeks of listening — interviews, audits, alignment.', capsule: { text: 'Week 1', color: 'gold' } },
        { label: 'Step 2', title: 'Strategy',  subtitle: 'Frame the bet. One page, one team, one number.',         capsule: { text: 'Week 2-3', color: 'ember' } },
        { label: 'Step 3', title: 'Build',     subtitle: 'Two-week increments, demo every Friday.',                capsule: { text: 'Week 4-8', color: 'cream' } },
        { label: 'Step 4', title: 'Scale',     subtitle: 'Compound the wins. Quarterly review against the bet.',   capsule: { text: 'Ongoing', color: 'outline' } },
      ],
    },
  },
  QrMeetingSlide: {
    label: 'QR / Contact',
    blurb: 'Branded QR + meeting label. Set contact rows for the full contact card.',
    fields: ['eyebrow', 'title', 'subtitle', 'meetingUrl', 'meetingLabel', 'qrStyle', 'contactRows', 'cta', 'socials'],
    defaults: {
      eyebrow: "LET'S TALK",
      title: 'Book a Call',
      meetingUrl: 'https://meet.rasia.pro/intro-call',
      meetingLabel: 'meet.rasia.pro/intro-call',
      qrStyle: 'clean',
    },
    slideDefaults: { titleStyle: 'cream' },
  },
  ImageSlide: {
    label: 'Image',
    blurb: 'Full-bleed image with optional caption.',
    fields: ['title', 'subtitle', 'image'],
    defaults: {
      title: 'Visual Anchor',
      subtitle: 'Optional caption beneath the image.',
      image: '/placeholder.svg',
    },
  },
  ClickRevealSlide: {
    label: 'Click Reveal',
    blurb: 'Hidden slide revealed only via a parent capsule or hotspot. Outside the linear flow.',
    fields: ['eyebrow', 'title', 'subtitle', 'capsules'],
    defaults: {
      eyebrow: 'DEEP DIVE',
      title: 'Reveal Detail',
      subtitle: 'Shown when triggered from a parent slide.',
    },
    slideDefaults: { isClickReveal: true },
  },
  SectionDividerSlide: {
    label: 'Section Divider',
    blurb: 'Hero punctuation between sections. White title, no chrome.',
    fields: ['eyebrow', 'title', 'subtitle'],
    defaults: {
      eyebrow: 'ACT TWO',
      title: 'The Build Phase',
      subtitle: 'A brief transition into the next section.',
    },
    slideDefaults: { showBrandHeader: false, brandStrip: false },
  },
  MetricGridSlide: {
    label: 'Metric Grid',
    blurb: 'Compact 2-6 cell grid of headline metrics — big number + label + caption.',
    fields: ['eyebrow', 'title', 'subtitle', 'metrics'],
    defaults: {
      eyebrow: 'BY THE NUMBERS',
      title: 'Proof of Impact',
      subtitle: 'Last 12 months across the full Riseup Asia portfolio.',
      metrics: [
        { value: '3.4M', label: 'Users reached',  caption: 'Across all client surfaces.', accent: 'gold' },
        { value: '99.9%', label: 'Uptime',        caption: 'Rolling 90-day SLO.',         accent: 'teal' },
        { value: '<10ms', label: 'P95 latency',   caption: 'Edge-rendered globally.',     accent: 'sky' },
        { value: '$4.2M', label: 'ARR added',     caption: 'Net-new in 2025.',            accent: 'ember' },
      ],
    },
  },

  // ───── v0.169 generic slide types ─────
  TableSlide: {
    label: 'Comparison Table',
    blurb: 'Compare 4–8 options across 3–5 attributes. Per-row accent bar, themed header.',
    fields: ['eyebrow', 'title', 'subtitle', 'tableColumns', 'tableRows'],
    defaults: {
      eyebrow: 'COMPARISON',
      title: 'Pick the right tool',
      tableColumns: [
        { key: 'name',    label: 'Option' },
        { key: 'speed',   label: 'Speed' },
        { key: 'cost',    label: 'Cost' },
        { key: 'verdict', label: 'Verdict' },
      ],
      tableRows: [
        { name: 'Option A', cells: { speed: 'Fast',   cost: '$$',  verdict: 'Recommended' }, accent: 'gold' },
        { name: 'Option B', cells: { speed: 'Medium', cost: '$',   verdict: 'Good fit'    }, accent: 'teal' },
        { name: 'Option C', cells: { speed: 'Slow',   cost: '$$$', verdict: 'Avoid'       }, accent: 'ember' },
      ],
    },
  },
  CodeBlockSlide: {
    label: 'Code Block',
    blurb: 'Title + hero code block. Shiki-highlighted, manual tokens, or plain.',
    fields: ['eyebrow', 'title', 'subtitle', 'code', 'codeLanguage'],
    defaults: {
      eyebrow: 'EXAMPLE',
      title: 'Show, don\'t tell',
      code: "SELECT name, email\nFROM users\nWHERE created_at > '2025-02-01';",
      codeLanguage: 'sql',
      codeSyntax: 'shiki',
    },
  },
  BoxDiagramSlide: {
    label: 'Box Diagram',
    blurb: 'Generic boxes-and-fields diagram (ER, architecture, state). Inline SVG.',
    fields: ['eyebrow', 'title', 'subtitle', 'diagramNodes', 'diagramEdges', 'diagramExplanation'],
    defaults: {
      eyebrow: 'SCHEMA',
      title: 'How it connects',
      diagramNodes: [
        { id: 'a', title: 'Users', x: 8,  y: 20, w: 22, fields: [
          { name: 'id', type: 'uuid', role: 'pk' },
          { name: 'email', type: 'text' },
        ]},
        { id: 'b', title: 'Posts', x: 70, y: 20, w: 22, fields: [
          { name: 'id', type: 'uuid', role: 'pk' },
          { name: 'user_id', type: 'uuid', role: 'fk' },
          { name: 'body', type: 'text' },
        ]},
      ],
      diagramEdges: [{ from: 'a', to: 'b', label: 'writes', cardinality: ['1', 'N'] }],
    },
  },
  ERDiagramSlide: {
    label: 'ER Diagram',
    blurb: 'Entity-relationship diagram with auto navy palette (cyan PK, orange FK).',
    fields: ['eyebrow', 'title', 'subtitle', 'entities', 'relationships', 'diagramExplanation'],
    defaults: {
      eyebrow: 'SCHEMA',
      title: 'Users ↔ Posts',
      entities: [
        { id: 'users', title: 'Users', x: 8,  y: 25, w: 22, fields: [
          { name: 'id',         type: 'uuid', role: 'pk' },
          { name: 'email',      type: 'text' },
          { name: 'created_at', type: 'timestamptz' },
        ]},
        { id: 'posts', title: 'Posts', x: 70, y: 25, w: 22, fields: [
          { name: 'id',      type: 'uuid', role: 'pk' },
          { name: 'user_id', type: 'uuid', role: 'fk' },
          { name: 'body',    type: 'text' },
        ]},
      ],
      relationships: [{ from: 'users', to: 'posts', label: 'writes', cardinality: ['1', 'N'] }],
    },
  },
  LayoutSlide: {
    label: 'Layout Wrapper',
    blurb: 'Generic 5/7, 4/8, 2-equal, 2x3 cards, or centered hero. Slot-based.',
    fields: ['eyebrow', 'title', 'subtitle', 'layout', 'layoutSlots'],
    defaults: {
      eyebrow: 'OVERVIEW',
      title: 'Side by side',
      layout: 'split-2-equal',
      layoutSlots: [
        { kind: 'card', title: 'Pros',  body: 'Fast, simple, predictable.', variant: 'success' },
        { kind: 'card', title: 'Cons',  body: 'Less flexible at scale.',     variant: 'danger' },
      ],
    },
  },
  DatabaseDiagramSlide: {
    label: 'Database ERD',
    blurb: 'Single ER diagram. ≤5 entities, ≤6 relationships. Theme-token SVG.',
    fields: ['eyebrow', 'title', 'subtitle'],
    defaults: {
      eyebrow: 'Schema · core',
      title: 'Order graph',
      dbEntities: [
        { id: 'users', name: 'USERS', fields: ['id', 'email'] },
        { id: 'orders', name: 'ORDERS', fields: ['id', 'user_id', 'total'] },
        { id: 'items', name: 'ORDER_ITEMS', fields: ['id', 'order_id', 'sku'] },
      ],
      dbRelationships: [
        { from: 'users', to: 'orders', label: 'places' },
        { from: 'orders', to: 'items', label: 'contains' },
      ],
    },
  },
  DataTableSlide: {
    label: 'Data Table (narrow)',
    blurb: 'Caps-enforced table — ≤5 cols × ≤8 rows. Header + row stagger.',
    fields: ['eyebrow', 'title'],
    defaults: {
      eyebrow: 'Plans',
      title: 'Plan comparison',
      dataColumns: [
        { key: 'plan',  label: 'Plan',  align: 'left' },
        { key: 'seats', label: 'Seats', align: 'right' },
        { key: 'price', label: 'Price', align: 'right' },
      ],
      dataRows: [
        { plan: 'Solo',   seats: '1',  price: '$0',   accent: 'cream' },
        { plan: 'Team',   seats: '10', price: '$49',  accent: 'gold' },
        { plan: 'Studio', seats: '50', price: '$199', accent: 'ember' },
      ],
    },
  },
  NumberCalloutSlide: {
    label: 'Number Callout',
    blurb: 'ONE oversized animated number. Easings: linear / easeOutQuint / spring.',
    fields: ['eyebrow'],
    defaults: {
      eyebrow: 'Engagement',
      number: { from: 0, to: 92, unit: '%', easing: 'easeOutQuint', duration: 'slow' },
      label: 'of users return within 7 days',
      capsule: { color: 'gold', text: 'Cohort · Apr 2026' },
    },
  },
  EquationSlide: {
    label: 'Equation',
    blurb: 'ONE equation, term-by-term Stagger reveal.',
    fields: ['eyebrow', 'title'],
    defaults: {
      eyebrow: 'Growth',
      title: 'Compound growth',
      tex: 'A = P (1 + r)^t',
      termIds: ['A', 'eq', 'P', 'factor'],
      equationLabels: {
        left:  { color: 'cream', text: 'P = principal' },
        right: { color: 'ember', text: 't = years' },
      },
    },
  },
  ChecklistSlide: {
    label: 'Checklist',
    blurb: 'Audience-facing checklist. Click to confirm done; gold progress bar. ≤7 items.',
    fields: ['eyebrow', 'title'],
    defaults: {
      eyebrow: 'Live walkthrough',
      title: 'Pre-flight checklist',
      progressColor: 'gold',
      items: [
        { text: 'Brand identity locked',  detail: 'Logo, color tokens, type pair signed off' },
        { text: 'Slide deck rehearsed',   detail: 'Run-through with timer, no hand-offs' },
        { text: 'Demo environment seeded', detail: 'Sample data, no PII, fast network' },
        { text: 'Q&A talking points',     detail: 'Top 5 likely questions + crisp answers' },
      ],
    },
  },
  TileSlide: {
    label: 'Tile grid',
    blurb: 'N (2–4) clickable tile cards in a row. Each links to an external URL.',
    fields: ['eyebrow', 'title', 'subtitle'],
    defaults: {
      eyebrow: "Today's goal",
      title: "We'll build two CLIs along the way.",
      tiles: [
        { name: 'Alarm CLI', tag: 'alarm-app-v3', desc: 'A terminal alarm clock. Schedules, notifications, snooze.', url: 'https://github.com/', glyph: '⏰' },
        { name: 'Movie CLI', tag: 'movie-cli-v8', desc: 'Search, browse and surface movie data right from the terminal.', url: 'https://github.com/', glyph: '🎬' },
        { name: 'Gitmap',    tag: 'gitmap-v13',   desc: "Map your repos visually. Today's candidate for a new feature.", url: 'https://github.com/', glyph: '🌐' },
      ],
      tilesCaption: 'Click any tile to open the link.',
    },
  },
  // BlastRadiusSlide — single oversized chrome word; eyebrow + subtitle are
  // optional whispers. Pairs with the `ZoomOut` exit transition. See
  // `spec/26-slide-definitions/_patterns/blast-radius-slide.md`.
  BlastRadiusSlide: {
    label: 'Blast radius',
    blurb: 'Cinematic title moment — chrome word + tumbling shards + drifting particles + zoom-out exit.',
    fields: ['eyebrow', 'title', 'subtitle'],
    defaults: {
      eyebrow: 'CHAPTER 03',
      title: 'Blast Radius',
      subtitle: 'what breaks when one secret leaks',
    },
    slideDefaults: { transition: 'ZoomOut' as never, showBrandHeader: false, showPresenterChip: false, brandStrip: false },
  },
  // SessionOutlineSlide — vertical numbered agenda. Title block + 2–8 outline
  // rows (index numeral · title · subtitle · meta capsule). Optional
  // `activeIndex` highlights the current row. The `kicker` + `items` fields
  // are author-edited via the JSON spec (the in-app builder only exposes the
  // header fields). See `spec/26-slide-definitions/_patterns/session-outline-slide.md`.
  SessionOutlineSlide: {
    label: 'Session outline',
    blurb: 'Numbered agenda list — index · title · subtitle · meta capsule. Optional active-row highlight.',
    fields: ['eyebrow', 'title'],
    defaults: {
      eyebrow: 'TODAY',
      title: 'Session outline',
      // kicker + items live in JSON; not editable in the form yet but seeded
      // here so a freshly-picked SessionOutlineSlide renders something useful.
      kicker: 'What we will cover, in order.',
      items: [
        { title: 'Recap',      subtitle: 'Where we left off',  meta: '5 min',  capsule: { text: '01', color: 'gold' } },
        { title: 'Mindset',    subtitle: 'Bad becomes master', meta: '3 min',  capsule: { text: '02', color: 'ember' } },
        { title: 'Build',      subtitle: 'Two CLIs, live',     meta: '35 min', capsule: { text: '03', color: 'cream' } },
        { title: 'Guardrails', subtitle: 'Steer the model',    meta: '10 min', capsule: { text: '04', color: 'gold' } },
        { title: 'Your call',  subtitle: 'What we ship next',  meta: '10 min', capsule: { text: '05', color: 'outline' } },
      ],
    } as unknown as Partial<SlideContent>,
  },
  FullBleedImageSlide: {
    label: 'Full-bleed image',
    blurb: 'Edge-to-edge hero image/GIF with legibility scrim and overlaid eyebrow + title + caption.',
    fields: ['eyebrow', 'title', 'subtitle', 'image'],
    defaults: {
      eyebrow: 'CHAPTER',
      title: 'The photo is the slide',
      subtitle: 'One quiet line of context.',
      image: '/placeholder.svg',
      scrim: 'bottom',
    },
  },
  SplitMediaSlide: {
    label: 'Split media',
    blurb: 'Two-column show + tell: image/GIF on one half, eyebrow + title + keywords + capsules on the other.',
    fields: ['eyebrow', 'title', 'keywords', 'capsules', 'image'],
    defaults: {
      eyebrow: 'SHOW + TELL',
      title: 'Media meets message',
      keywords: ['Point one', 'Point two', 'Point three'],
      image: '/placeholder.svg',
      mediaSide: 'left',
    },
  },
  MediaGridSlide: {
    label: 'Media grid',
    blurb: '2–6 image/SVG tiles with optional captions. Galleries, logo walls, screenshot grids.',
    fields: ['eyebrow', 'title'],
    defaults: {
      eyebrow: 'GALLERY',
      title: 'A grid of moments',
      mediaTiles: [
        { src: '/placeholder.svg', caption: 'One' },
        { src: '/placeholder.svg', caption: 'Two' },
        { src: '/placeholder.svg', caption: 'Three' },
        { src: '/placeholder.svg', caption: 'Four' },
      ],
    },
  },
  GifLoopSlide: {
    label: 'GIF loop',
    blurb: 'A single looping GIF + caption. Reduced-motion swaps in a static poster frame.',
    fields: ['eyebrow', 'title', 'image'],
    defaults: {
      eyebrow: 'LIVE DEMO',
      title: 'One tap to publish',
      caption: 'The whole flow in under three seconds.',
      image: '/placeholder.svg',
      poster: '/placeholder.svg',
    },
  },
};

/** Ordered list of slide-type keys for the picker. */
export const SLIDE_TYPE_KEYS: SlideTypeValue[] = [
  'TitleSlide',
  'SectionDividerSlide',
  'KeywordSlide',
  'CapsuleListSlide',
  'StepTimelineSlide',
  'FocusTimelineSlide',
  'ImageSlide',
  'QrMeetingSlide',
  'MetricGridSlide',
  'TableSlide',
  'CodeBlockSlide',
  'BoxDiagramSlide',
  'ERDiagramSlide',
  'LayoutSlide',
  'DatabaseDiagramSlide',
  'DataTableSlide',
  'NumberCalloutSlide',
  'EquationSlide',
  'ChecklistSlide',
  'ClickRevealSlide',
  'BlastRadiusSlide',
  'SessionOutlineSlide',
  'FullBleedImageSlide',
  'SplitMediaSlide',
  'MediaGridSlide',
];
