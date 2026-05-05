/**
 * Ready-to-run test fixtures, one per slideType.
 *
 * # Why this file exists
 * When you add a new slideType — or tighten an existing contract — you
 * want to know in one shot:
 *   1. A *known-good* example still parses cleanly (regression safety).
 *   2. A *deliberately broken* example fails on the **expected** field
 *      with the **expected** message (catches contract drift early).
 *
 * # Shape
 * Each entry pairs:
 *   - `valid`   → a complete `SlideSpec` payload that MUST parse.
 *   - `invalid` → an array of `{ payload, expectPath, expectedMessageMatch,
 *                  description }` cases. Each case mutates one rule of the
 *                  contract so a single broken field is exercised in
 *                  isolation. `expectPath` is the dotted JSON pointer the
 *                  validator should report (e.g. `content.steps.0.title`).
 *
 * # How to consume
 *   - `bun test src/test/slideFixtures.test.ts` — verifies every fixture
 *     behaves as advertised against the live `validateSlide()` contract.
 *   - In your own ad-hoc script, import `SLIDE_FIXTURES.StepTimelineSlide`
 *     and feed `valid` straight into the deck loader to preview the slide,
 *     or feed any `invalid[i].payload` into `validateSlide()` to see the
 *     formatted issue list.
 *
 * # Adding a new slideType
 *   1. Add a `Capsule`/`Step`/`Metric`-style sub-fixture if needed.
 *   2. Add a `<NewType>: { valid, invalid: [...] }` entry below.
 *   3. Re-run the test — it auto-asserts every fixture against the
 *      registry in `SLIDE_CONTENT_CONTRACTS` so missing entries surface
 *      immediately.
 *
 * The fixtures are intentionally hand-written (not generated from zod's
 * schema) so the test can detect regressions where the contract drifts
 * from the *intended* shape, not just from a self-consistent generator.
 */

import type { SlideSpec } from '../slides/types';

/** One invalid payload + the contract violation it should trip. */
export interface InvalidFixture {
  /** Plain-English description used as the test name. */
  description: string;
  /** The malformed slide payload. */
  payload: unknown;
  /** Dotted path the validator must report (e.g. `content.steps.0.title`). */
  expectPath: string;
  /** Substring (or regex) the zod error message must contain. */
  expectedMessageMatch: string | RegExp;
}

export interface SlideFixture {
  /** A reason-phrase describing what makes this fixture realistic. */
  description: string;
  /** Complete, schema-valid slide payload. MUST parse. */
  valid: SlideSpec;
  /** Per-rule deliberate failures. Each MUST fail on `expectPath`. */
  invalid: InvalidFixture[];
}

// ---------- Shared envelope helper ----------

/**
 * Every fixture starts from a sane envelope — slideNumber/name/transition/
 * textAnimation — so each individual test only varies the bits that
 * matter for the rule under exercise.
 */
function envelope(slideNumber: number, slideName: string, slideType: string) {
  return {
    slideNumber,
    slideName,
    slideType,
    transition: 'FadeIn',
    textAnimation: 'FadeIn',
  };
}

// ---------- Fixtures ----------

export const SLIDE_FIXTURES: Record<string, SlideFixture> = {
  TitleSlide: {
    description: 'Hero title slide — title is the only required content field.',
    valid: {
      ...envelope(1, 'Hero', 'TitleSlide'),
      content: { title: 'Riseup Asia LLC', subtitle: 'AI-native operators' },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects empty title',
        payload: { ...envelope(1, 'Hero', 'TitleSlide'), content: { title: '' } },
        expectPath: 'content.title',
        expectedMessageMatch: /at least 1 character|String must contain/i,
      },
      {
        description: 'rejects missing title field',
        payload: { ...envelope(1, 'Hero', 'TitleSlide'), content: {} },
        expectPath: 'content.title',
        expectedMessageMatch: /required|Required/,
      },
    ],
  },

  MiddleTitleSlide: {
    description: 'Mid-deck section break with a single oversized title line.',
    valid: {
      ...envelope(2, 'Section break', 'MiddleTitleSlide'),
      content: { title: 'Now — what we ship.' },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects empty title',
        payload: { ...envelope(2, 'Section break', 'MiddleTitleSlide'), content: { title: '' } },
        expectPath: 'content.title',
        expectedMessageMatch: /at least 1 character|String must contain/i,
      },
    ],
  },

  SectionDividerSlide: {
    description: 'Chapter card between major sections.',
    valid: {
      ...envelope(3, 'Chapter II', 'SectionDividerSlide'),
      content: { title: 'Chapter II — Operations' },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects missing title',
        payload: { ...envelope(3, 'Chapter II', 'SectionDividerSlide'), content: {} },
        expectPath: 'content.title',
        expectedMessageMatch: /required|Required/,
      },
    ],
  },

  KeywordSlide: {
    description: 'Three-or-more keyword cloud — title + at least 3 keywords.',
    valid: {
      ...envelope(4, 'Keywords', 'KeywordSlide'),
      content: { title: 'What we obsess over', keywords: ['Speed', 'Ownership', 'Craft'] },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects fewer than 3 keywords',
        payload: {
          ...envelope(4, 'Keywords', 'KeywordSlide'),
          content: { title: 'What we obsess over', keywords: ['Speed', 'Ownership'] },
        },
        expectPath: 'content.keywords',
        expectedMessageMatch: /at least 3|Array must contain at least 3/i,
      },
      {
        description: 'rejects missing keywords array',
        payload: { ...envelope(4, 'Keywords', 'KeywordSlide'), content: { title: 'X' } },
        expectPath: 'content.keywords',
        expectedMessageMatch: /required|Required/,
      },
    ],
  },

  CapsuleListSlide: {
    description: 'Capsule grid — title + 3+ colored capsules.',
    valid: {
      ...envelope(5, 'Capabilities', 'CapsuleListSlide'),
      content: {
        title: 'Capabilities',
        capsules: [
          { text: 'Strategy', color: 'gold' },
          { text: 'Engineering', color: 'ember' },
          { text: 'Design', color: 'cream' },
        ],
      },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects fewer than 3 capsules',
        payload: {
          ...envelope(5, 'Capabilities', 'CapsuleListSlide'),
          content: {
            title: 'Capabilities',
            capsules: [
              { text: 'Strategy', color: 'gold' },
              { text: 'Engineering', color: 'ember' },
            ],
          },
        },
        expectPath: 'content.capsules',
        expectedMessageMatch: /at least 3|Array must contain at least 3/i,
      },
      {
        description: 'rejects unknown capsule color',
        payload: {
          ...envelope(5, 'Capabilities', 'CapsuleListSlide'),
          content: {
            title: 'Capabilities',
            capsules: [
              { text: 'Strategy', color: 'gold' },
              { text: 'Engineering', color: 'ember' },
              { text: 'Design', color: 'neon-pink' }, // not in enum
            ],
          },
        },
        expectPath: 'content.capsules.2.color',
        expectedMessageMatch: /Invalid enum|expected one of/i,
      },
      {
        description: 'rejects empty capsule text',
        payload: {
          ...envelope(5, 'Capabilities', 'CapsuleListSlide'),
          content: {
            title: 'Capabilities',
            capsules: [
              { text: 'Strategy', color: 'gold' },
              { text: 'Engineering', color: 'ember' },
              { text: '', color: 'cream' },
            ],
          },
        },
        expectPath: 'content.capsules.2.text',
        expectedMessageMatch: /at least 1|String must contain/i,
      },
    ],
  },

  StepTimelineSlide: {
    description: 'Numbered timeline — title + 3-6 steps with label/title/subtitle.',
    valid: {
      ...envelope(6, 'Process', 'StepTimelineSlide'),
      content: {
        title: 'Our process',
        steps: [
          { label: '01', title: 'Discover', subtitle: 'Audit and align on goals.' },
          { label: '02', title: 'Design', subtitle: 'Wireframes and prototypes.' },
          { label: '03', title: 'Deliver', subtitle: 'Ship, measure, iterate.' },
        ],
      },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects fewer than 3 steps',
        payload: {
          ...envelope(6, 'Process', 'StepTimelineSlide'),
          content: {
            title: 'Our process',
            steps: [
              { label: '01', title: 'Discover', subtitle: 'Audit.' },
              { label: '02', title: 'Design', subtitle: 'Wireframe.' },
            ],
          },
        },
        expectPath: 'content.steps',
        expectedMessageMatch: /at least 3|Array must contain at least 3/i,
      },
      {
        description: 'rejects more than 6 steps',
        payload: {
          ...envelope(6, 'Process', 'StepTimelineSlide'),
          content: {
            title: 'Our process',
            steps: Array.from({ length: 7 }, (_, i) => ({
              label: String(i + 1).padStart(2, '0'),
              title: `Step ${i + 1}`,
              subtitle: 'lorem',
            })),
          },
        },
        expectPath: 'content.steps',
        expectedMessageMatch: /at most 6|Array must contain at most 6/i,
      },
      {
        description: 'rejects step with empty subtitle',
        payload: {
          ...envelope(6, 'Process', 'StepTimelineSlide'),
          content: {
            title: 'Our process',
            steps: [
              { label: '01', title: 'Discover', subtitle: 'Audit.' },
              { label: '02', title: 'Design', subtitle: '' },
              { label: '03', title: 'Deliver', subtitle: 'Ship.' },
            ],
          },
        },
        expectPath: 'content.steps.1.subtitle',
        expectedMessageMatch: /at least 1|String must contain/i,
      },
    ],
  },

  FocusTimelineSlide: {
    description: 'Single-focus timeline — title + 1+ steps.',
    valid: {
      ...envelope(7, 'Focus', 'FocusTimelineSlide'),
      content: {
        title: 'Sprint 12 focus',
        steps: [{ label: '01', title: 'Launch', subtitle: 'Public beta on Friday.' }],
      },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects empty steps array',
        payload: {
          ...envelope(7, 'Focus', 'FocusTimelineSlide'),
          content: { title: 'Sprint 12 focus', steps: [] },
        },
        expectPath: 'content.steps',
        expectedMessageMatch: /at least 1|Array must contain at least 1/i,
      },
    ],
  },

  AdvanceStepSlide: {
    description: 'Click-advance step animation — title + 1+ steps.',
    valid: {
      ...envelope(8, 'Walkthrough', 'AdvanceStepSlide'),
      content: {
        title: 'Walkthrough',
        steps: [
          { label: '01', title: 'Open dashboard', subtitle: 'Click the gold pill.' },
          { label: '02', title: 'Pick a slide', subtitle: 'Use the grid view.' },
        ],
      },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects step with missing label',
        payload: {
          ...envelope(8, 'Walkthrough', 'AdvanceStepSlide'),
          content: {
            title: 'Walkthrough',
            steps: [{ title: 'Open dashboard', subtitle: 'Click.' }],
          },
        },
        expectPath: 'content.steps.0.label',
        expectedMessageMatch: /required|Required/,
      },
    ],
  },

  StepsChain3DSlide: {
    description: 'Cinematic 3D step chain — bullets[] required.',
    valid: {
      ...envelope(20, 'Process', 'StepsChain3DSlide'),
      content: {
        title: 'Process',
        steps: [
          { label: '01', title: 'Discover', subtitle: 'Stakeholder alignment.', description: { bullets: ['Interviews', 'Audit'] } },
          { label: '02', title: 'Design',   subtitle: 'Wireframes + spec.',     description: { bullets: ['IA', 'Mocks'] } },
        ],
      },
    } as unknown as SlideSpec,
    invalid: [],
  },

  ImageSlide: {
    description: 'Full-bleed image slide — image path is the only required field.',
    valid: {
      ...envelope(9, 'Brand image', 'ImageSlide'),
      content: { image: '/assets/brand/hero.jpg', caption: 'Our 2025 offsite.' },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects empty image path',
        payload: { ...envelope(9, 'Brand image', 'ImageSlide'), content: { image: '' } },
        expectPath: 'content.image',
        expectedMessageMatch: /at least 1|String must contain/i,
      },
      {
        description: 'rejects missing image field entirely',
        payload: { ...envelope(9, 'Brand image', 'ImageSlide'), content: {} },
        expectPath: 'content.image',
        expectedMessageMatch: /required|Required/,
      },
    ],
  },

  QrMeetingSlide: {
    description: 'QR meeting CTA — needs ANY of meetingUrl / qrUrl / qrAsset.',
    valid: {
      ...envelope(10, 'Meeting', 'QrMeetingSlide'),
      content: { meetingUrl: 'https://cal.com/riseup/intro', title: 'Scan to meet' },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects content with none of meetingUrl / qrUrl / qrAsset',
        payload: {
          ...envelope(10, 'Meeting', 'QrMeetingSlide'),
          content: { title: 'Scan to meet' }, // no source provided
        },
        expectPath: 'content',
        expectedMessageMatch: /meetingUrl, qrUrl, qrAsset/,
      },
    ],
  },

  MetricGridSlide: {
    description: 'KPI grid — title + 2-6 metrics.',
    valid: {
      ...envelope(11, 'Impact', 'MetricGridSlide'),
      content: {
        title: 'Impact in 2024',
        metrics: [
          { value: '3.2×', label: 'ARR growth' },
          { value: '99.98%', label: 'Uptime' },
          { value: '12 wk', label: 'Avg time to launch' },
        ],
      },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects fewer than 2 metrics',
        payload: {
          ...envelope(11, 'Impact', 'MetricGridSlide'),
          content: {
            title: 'Impact in 2024',
            metrics: [{ value: '3.2×', label: 'ARR growth' }],
          },
        },
        expectPath: 'content.metrics',
        expectedMessageMatch: /at least 2|Array must contain at least 2/i,
      },
      {
        description: 'rejects metric with empty value',
        payload: {
          ...envelope(11, 'Impact', 'MetricGridSlide'),
          content: {
            title: 'Impact in 2024',
            metrics: [
              { value: '3.2×', label: 'ARR growth' },
              { value: '', label: 'Uptime' },
            ],
          },
        },
        expectPath: 'content.metrics.1.value',
        expectedMessageMatch: /at least 1|String must contain/i,
      },
    ],
  },

  // ───── v0.169 generic slide-type fixtures ─────
  TableSlide: {
    description: 'Comparison table — title + columns + rows.',
    valid: {
      ...envelope(12, 'Compare', 'TableSlide'),
      content: {
        title: 'Pick the right tool',
        tableColumns: [
          { key: 'name', label: 'Option' },
          { key: 'speed', label: 'Speed' },
        ],
        tableRows: [
          { name: 'A', cells: { speed: 'Fast' }, accent: 'gold' },
          { name: 'B', cells: { speed: 'Slow' }, accent: 'ember' },
        ],
      },
    } as unknown as SlideSpec,
    invalid: [],
  },
  CodeBlockSlide: {
    description: 'Code block — title + code body, with copy button + line emphasis.',
    valid: {
      ...envelope(13, 'Code', 'CodeBlockSlide'),
      content: {
        title: 'SQL example',
        code: "SELECT id, email\nFROM users\nWHERE created_at > '2025-02-01';\n-- emphasised below",
        codeLanguage: 'sql',
        codeHighlightLines: [3],
        codeCopyButton: true,
        codeShowLineNumbers: true,
        codeCaption: 'Highlighted: predicate row',
      },
    } as unknown as SlideSpec,
    invalid: [],
  },
  BoxDiagramSlide: {
    description: 'Generic box diagram — nodes + edges.',
    valid: {
      ...envelope(14, 'Diagram', 'BoxDiagramSlide'),
      content: {
        title: 'How it connects',
        diagramNodes: [
          { id: 'a', title: 'A', x: 10, y: 30 },
          { id: 'b', title: 'B', x: 70, y: 30 },
        ],
        diagramEdges: [{ from: 'a', to: 'b' }],
      },
    } as unknown as SlideSpec,
    invalid: [],
  },
  ERDiagramSlide: {
    description: 'ER diagram — entities + relationships, navy palette.',
    valid: {
      ...envelope(16, 'ERDiagram', 'ERDiagramSlide'),
      content: {
        title: 'Schema',
        entities: [
          { id: 'u', title: 'Users', x: 8,  y: 25, w: 22, fields: [
            { name: 'id', type: 'uuid', role: 'pk' },
            { name: 'email', type: 'text' },
          ]},
          { id: 'p', title: 'Posts', x: 70, y: 25, w: 22, fields: [
            { name: 'id', type: 'uuid', role: 'pk' },
            { name: 'user_id', type: 'uuid', role: 'fk' },
          ]},
        ],
        relationships: [{ from: 'u', to: 'p', label: 'writes', cardinality: ['1', 'N'] }],
      },
    } as unknown as SlideSpec,
    invalid: [],
  },
  LayoutSlide: {
    description: 'Generic layout wrapper — slot-based grid.',
    valid: {
      ...envelope(15, 'Layout', 'LayoutSlide'),
      content: {
        title: 'Side by side',
        layout: 'split-2-equal',
        layoutSlots: [
          { kind: 'card', title: 'Pros', body: 'Fast.' },
          { kind: 'card', title: 'Cons', body: 'Less flexible.' },
        ],
      },
    } as unknown as SlideSpec,
    invalid: [],
  },
  DatabaseDiagramSlide: {
    description: 'Single ER diagram (≤5 entities, ≤6 relationships).',
    valid: {
      ...envelope(16, 'ERD', 'DatabaseDiagramSlide'),
      content: {
        title: 'Order graph',
        dbEntities: [
          { id: 'u', name: 'USERS' },
          { id: 'o', name: 'ORDERS' },
        ],
        dbRelationships: [{ from: 'u', to: 'o', label: 'places' }],
      },
    } as unknown as SlideSpec,
    invalid: [],
  },
  DataTableSlide: {
    description: 'Density-capped table (≤5 cols × ≤8 rows).',
    valid: {
      ...envelope(17, 'Plans', 'DataTableSlide'),
      content: {
        title: 'Plan comparison',
        dataColumns: [
          { key: 'plan', label: 'Plan' },
          { key: 'price', label: 'Price' },
        ],
        dataRows: [
          { plan: 'Solo', price: '$0' },
          { plan: 'Team', price: '$49' },
        ],
      },
    } as unknown as SlideSpec,
    invalid: [],
  },
  NumberCalloutSlide: {
    description: 'ONE animated number with optional unit + capsule.',
    valid: {
      ...envelope(18, 'Engagement', 'NumberCalloutSlide'),
      content: {
        eyebrow: 'Engagement',
        number: { from: 0, to: 92, unit: '%', easing: 'easeOutQuint', duration: 'slow' },
        label: 'of users return within 7 days',
      },
    } as unknown as SlideSpec,
    invalid: [],
  },
  EquationSlide: {
    description: 'ONE equation, term-by-term Stagger.',
    valid: {
      ...envelope(19, 'Compound growth', 'EquationSlide'),
      content: {
        title: 'Compound growth',
        tex: 'A = P (1 + r)^t',
        termIds: ['A', 'eq', 'P', 'factor'],
      },
    } as unknown as SlideSpec,
    invalid: [],
  },
  ChecklistSlide: {
    description: 'Audience checklist — 2–7 items, click-to-confirm progress (spec 62).',
    valid: {
      ...envelope(22, 'Pre-flight', 'ChecklistSlide'),
      content: {
        title: 'Pre-flight checklist',
        items: [
          { text: 'Brand identity locked' },
          { text: 'Slide deck rehearsed', detail: 'Run-through with timer' },
          { text: 'Demo environment seeded' },
        ],
      },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects fewer than 2 items',
        payload: {
          ...envelope(22, 'Pre-flight', 'ChecklistSlide'),
          content: { title: 'Checklist', items: [{ text: 'Only one' }] },
        },
        expectPath: 'content.items',
        expectedMessageMatch: /at least 2|Array must contain at least 2/i,
      },
      {
        description: 'rejects more than 7 items',
        payload: {
          ...envelope(22, 'Pre-flight', 'ChecklistSlide'),
          content: {
            title: 'Checklist',
            items: Array.from({ length: 8 }, (_, i) => ({ text: `Item ${i + 1}` })),
          },
        },
        expectPath: 'content.items',
        expectedMessageMatch: /at most 7|Array must contain at most 7/i,
      },
    ],
  },

  BlastRadiusSlide: {
    description: 'Cinematic single-word title moment with chrome gradient + tumbling shards + zoom-out exit.',
    valid: {
      ...envelope(23, 'Blast radius opener', 'BlastRadiusSlide'),
      transition: 'ZoomOut',
      content: {
        eyebrow: 'CHAPTER 03',
        title: 'Blast Radius',
        subtitle: 'what breaks when one secret leaks',
      },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects empty title',
        payload: { ...envelope(23, 'Blast radius opener', 'BlastRadiusSlide'), content: { title: '' } },
        expectPath: 'content.title',
        expectedMessageMatch: /at least 1 character|String must contain/i,
      },
    ],
  },

  SessionOutlineSlide: {
    description: 'Vertical numbered agenda — title block + 2–8 outline rows with index, title, subtitle, meta capsule.',
    valid: {
      ...envelope(24, 'Session outline', 'SessionOutlineSlide'),
      content: {
        eyebrow: 'TODAY',
        title: 'Session outline',
        kicker: 'What we will cover, in order.',
        activeIndex: 1,
        items: [
          { title: 'Recap',      subtitle: 'Where we left off',  meta: '5 min',  capsule: { text: '01', color: 'gold' } },
          { title: 'Mindset',    subtitle: 'Bad becomes master', meta: '3 min',  capsule: { text: '02', color: 'ember' } },
          { title: 'Build',      subtitle: 'Two CLIs, live',     meta: '35 min', capsule: { text: '03', color: 'cream' } },
          { title: 'Guardrails', subtitle: 'Steer the model',    meta: '10 min', capsule: { text: '04', color: 'gold' } },
          { title: 'Your call',  subtitle: 'What we ship next',  meta: '10 min', capsule: { text: '05', color: 'outline' } },
        ],
      },
    } as unknown as SlideSpec,
    invalid: [
      {
        description: 'rejects fewer than 2 items',
        payload: {
          ...envelope(24, 'Session outline', 'SessionOutlineSlide'),
          content: { title: 'Outline', items: [{ title: 'Only one' }] },
        },
        expectPath: 'content.items',
        expectedMessageMatch: /at least 2|Array must contain at least 2/i,
      },
    ],
  },
};

/** Convenience: every valid fixture as a flat array, in slideNumber order. */
export const VALID_SLIDE_FIXTURES: readonly SlideSpec[] = Object.values(SLIDE_FIXTURES)
  .map((f) => f.valid)
  .sort((a, b) => a.slideNumber - b.slideNumber);

/** Convenience: every invalid fixture flat-mapped, tagged with slideType. */
export const INVALID_SLIDE_FIXTURES: ReadonlyArray<InvalidFixture & { slideType: string }> =
  Object.entries(SLIDE_FIXTURES).flatMap(([slideType, f]) =>
    f.invalid.map((i) => ({ ...i, slideType })),
  );
