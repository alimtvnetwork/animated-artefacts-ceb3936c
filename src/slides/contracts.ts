/**
 * Machine-checkable per-slide-type contracts.
 *
 * One zod schema per `slideType`, combined into a discriminated union on
 * the `slideType` field. Validation fails fast with messages that name the
 * exact slide type and missing/invalid field — no more silent fallthroughs
 * to TitleSlide or blank previews.
 *
 * Source of truth pairing:
 *   - JSON Schema (authoring/IDE):   spec/slides/slide.schema.json
 *   - Runtime contract (this file):  src/slides/contracts.ts
 *
 * When you add a new slideType (see `spec/slides/llm/22-add-new-slide-type.md`):
 *   1. Add an entry to `REQUIRED_FIELDS` below.
 *   2. Add a zod schema and include it in `SlideContract`.
 *   3. Update `spec/slides/slide.schema.json` `slideType.enum` + `allOf` clause.
 *   4. Update `spec/slides/llm/23-slide-type-contracts.md` table.
 *   5. Bump `SLIDE_CONTRACTS_VERSION` so HMR / cache consumers re-pull.
 *
 * Last contract change: added `StepsChain3DSlide` (version 3).
 */

import { z } from 'zod';
import type { SlideSpec } from './types';

/**
 * Plain-data required-fields table — the human-readable contract.
 * Mirrors the zod schemas. Used by the lightweight validator and surfaced
 * in `spec/slides/llm/23-slide-type-contracts.md`.
 */
export const REQUIRED_FIELDS: Record<string, readonly string[]> = {
  TitleSlide:          ['title'],
  MiddleTitleSlide:    ['title'],
  SectionDividerSlide: ['title'],
  KeywordSlide:        ['title', 'keywords'],
  CapsuleListSlide:    ['title', 'capsules'],
  StepTimelineSlide:   ['title', 'steps'],
  FocusTimelineSlide:  ['title', 'steps'],
  AdvanceStepSlide:    ['title', 'steps'],
  StepsChain3DSlide:   ['title', 'steps'],
  ImageSlide:          ['image'],
  QrMeetingSlide:      ['meetingUrl|qrUrl|qrAsset'], // any-of
  MetricGridSlide:     ['title', 'metrics'],
  TableSlide:          ['title', 'tableColumns', 'tableRows'],
  CodeBlockSlide:      ['title', 'code|codeTokens'],
  BoxDiagramSlide:     ['title', 'diagramNodes'],
  ERDiagramSlide:      ['title', 'entities|diagramNodes'], // any-of
  LayoutSlide:           ['title', 'layoutSlots'],
  DatabaseDiagramSlide:  ['title', 'dbEntities'],
  DataTableSlide:        ['title', 'dataColumns', 'dataRows'],
  NumberCalloutSlide:    ['number'],
  EquationSlide:         ['tex|equationHtml'],
  ChecklistSlide:        ['title', 'items'],
  TileSlide:             ['title', 'tiles'],
} as const;

// ---------- Shared sub-contracts ----------

const Capsule = z.object({
  text: z.string().min(1),
  color: z.enum(['gold', 'ember', 'cream', 'ink', 'outline', 'violet', 'teal', 'rose', 'sky']),
}).passthrough();

const Step = z.object({
  label: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
}).passthrough();

/**
 * v0.213 — `Step3D` is the StepsChain3D-specific Step variant. It enforces
 * the project's "keywords-only" Core rule by rejecting any
 * `description.body` field. Authors must use `description.bullets[]` for
 * the right-panel content. Surfaces in the validation panel as a hard
 * contract error; warn-mode logs to console.
 */
/**
 * v0.214 — `Step3DDescription` accepts the project's keywords-only fields
 * AND tolerates a legacy `body` string for backward compatibility.
 * Legacy decks pass validation; the renderer auto-splits `body` on
 * `.`, `;`, `,` via `deriveBullets()` so older decks conform without
 * manual editing. The original strict rejection (v0.213) was relaxed
 * here once auto-conversion landed — see `legacyBodyToBullets.ts`.
 *
 * Authors should still migrate to `bullets[]` (the renderer fires a
 * dev-only console warning when `body` is used), but the deck no longer
 * fails to load.
 */
/**
 * Multi-line, copy-pasteable guidance shown in the validation panel +
 * boot error whenever an author hands StepsChain3D a description shape it
 * doesn't recognise (unknown key, all-empty object, etc.). Centralised so
 * every refinement points to the same example payload.
 */
const STEP3D_DESCRIPTION_HELP = [
  'StepsChain3D step.description allows ONLY these fields:',
  '  • title    — string (right-panel headline, optional)',
  '  • bullets  — string[] of 1–6 keywords (REQUIRED for prose)',
  '  • meta     — string (small chip under bullets, optional)',
  '  • body     — string (LEGACY — auto-split to bullets at render; migrate)',
  '',
  'Use bullets[] — never paragraphs. Example:',
  '  "description": {',
  '    "title": "Discovery & alignment",',
  '    "bullets": ["Stakeholder interviews", "System audit", "One-page brief"],',
  '    "meta": "Week 1"',
  '  }',
  '',
  'Common typos that trigger this error: text, content, summary, body_text,',
  'description, items, list, points. Rename them to "bullets" (array of strings).',
].join('\n');

const Step3DDescription = z.object({
  title: z.string().min(1).optional(),
  bullets: z.array(z.string().min(1)).min(1).max(6).optional(),
  meta: z.string().min(1).optional(),
  /** Legacy: auto-split into bullets at render time. */
  body: z.string().optional(),
}).strict({ message: STEP3D_DESCRIPTION_HELP }).superRefine((desc, ctx) => {
  // If a `description` is present but carries NO usable content
  // (no title, no bullets, no body, no meta), point the author at the
  // bullets[] field with the same rich help block. Catches `description: {}`
  // and decks where every field is an empty string.
  const hasAny =
    (typeof desc.title === 'string' && desc.title.length > 0) ||
    (Array.isArray(desc.bullets) && desc.bullets.length > 0) ||
    (typeof desc.body === 'string' && desc.body.length > 0) ||
    (typeof desc.meta === 'string' && desc.meta.length > 0);
  if (!hasAny) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'StepsChain3D step.description is empty. Add a `bullets[]` array of keywords.\n\n' +
        STEP3D_DESCRIPTION_HELP,
    });
  }
});
const Step3D = z.object({
  label: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: Step3DDescription.optional(),
}).passthrough();

const Metric = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
}).passthrough();

// ---------- Per-type content contracts ----------

const TitleContent           = z.object({ title: z.string().min(1) }).passthrough();
const MiddleTitleContent     = z.object({ title: z.string().min(1) }).passthrough();
const SectionDividerContent  = z.object({ title: z.string().min(1) }).passthrough();
const KeywordContent         = z.object({ title: z.string().min(1), keywords: z.array(z.string()).min(3) }).passthrough();
const CapsuleListContent     = z.object({ title: z.string().min(1), capsules: z.array(Capsule).min(3) }).passthrough();
const StepTimelineContent    = z.object({ title: z.string().min(1), steps: z.array(Step).min(3).max(6) }).passthrough();
const FocusTimelineContent   = z.object({ title: z.string().min(1), steps: z.array(Step).min(1) }).passthrough();
const AdvanceStepContent     = z.object({ title: z.string().min(1), steps: z.array(Step).min(1) }).passthrough();
const StepsChain3DContent    = z.object({ title: z.string().min(1), steps: z.array(Step3D).min(2).max(8) }).passthrough();
const ImageContent           = z.object({ image: z.string().min(1) }).passthrough();
const QrMeetingContent = z.object({}).passthrough().refine(
  (c: Record<string, unknown>) => Boolean(c.meetingUrl || c.qrUrl || c.qrAsset),
  { message: 'QrMeetingSlide.content requires one of: meetingUrl, qrUrl, qrAsset.' },
);
const MetricGridContent      = z.object({ title: z.string().min(1), metrics: z.array(Metric).min(2).max(6) }).passthrough();

// v0.169 — generic slide-type schemas. Topic-agnostic — author with any subject.
const TableColumn = z.object({ key: z.string().min(1), label: z.string().min(1) }).passthrough();
const TableRow    = z.object({ name: z.string().min(1), cells: z.record(z.string()) }).passthrough();
const TableContent = z.object({
  title: z.string().min(1),
  tableColumns: z.array(TableColumn).min(2).max(8),
  tableRows: z.array(TableRow).min(1).max(12),
}).passthrough();

const CodeContent = z.object({
  title: z.string().min(1),
}).passthrough().refine(
  (c: Record<string, unknown>) => Boolean(c.code) || Array.isArray(c.codeTokens),
  { message: 'CodeBlockSlide.content requires either `code` (string) or `codeTokens` (array).' },
);

const DiagramField = z.object({ name: z.string().min(1) }).passthrough();
const DiagramNode = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  fields: z.array(DiagramField).optional(),
}).passthrough();
const DiagramEdge = z.object({ from: z.string().min(1), to: z.string().min(1) }).passthrough();
const DiagramContent = z.object({
  title: z.string().min(1),
  diagramNodes: z.array(DiagramNode).min(2).max(20),
  diagramEdges: z.array(DiagramEdge).optional(),
}).passthrough();

/** ER diagrams accept either `entities`/`relationships` (preferred) or
 *  `diagramNodes`/`diagramEdges` (compat with BoxDiagramSlide). The refine
 *  enforces that at least one of the entity-bearing keys is present and
 *  has ≥2 nodes — same lower bound as BoxDiagramSlide so the canvas is
 *  never single-node-degenerate. */
const ERDiagramContent = z.object({
  title: z.string().min(1),
  entities: z.array(DiagramNode).optional(),
  relationships: z.array(DiagramEdge).optional(),
  diagramNodes: z.array(DiagramNode).optional(),
  diagramEdges: z.array(DiagramEdge).optional(),
}).passthrough().refine(
  (c: Record<string, unknown>) => {
    const ents = (c.entities ?? c.diagramNodes) as unknown[] | undefined;
    return Array.isArray(ents) && ents.length >= 2 && ents.length <= 20;
  },
  { message: 'ERDiagramSlide.content requires `entities` (or `diagramNodes`) with 2–20 items.' },
);

const LayoutSlot = z.object({}).passthrough();
const LayoutContent = z.object({
  title: z.string().min(1),
  layoutSlots: z.array(LayoutSlot).min(1).max(6),
}).passthrough();

// Addendum 29 — narrow-idea slide types.
const NumberCalloutContent = z.object({
  number: z.object({
    from: z.number().optional(),
    to: z.number(),
    unit: z.string().optional(),
    easing: z.enum(['linear', 'easeOutQuint', 'spring']).optional(),
    duration: z.enum(['fast', 'slow']).optional(),
    decimals: z.number().int().min(0).max(6).optional(),
  }),
  label: z.string().optional(),
  capsule: z.object({
    color: z.enum(['gold', 'ember', 'cream']),
    text: z.string().min(1),
  }).optional(),
}).passthrough();

const DataColumn = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  align: z.enum(['left', 'right', 'center']).optional(),
}).passthrough();
const DataTableContent = z.object({
  title: z.string().min(1),
  dataColumns: z.array(DataColumn).min(1).max(5),
  dataRows: z.array(z.record(z.string().optional())).min(1).max(8),
}).passthrough();

const EquationContent = z.object({
  title: z.string().optional(),
}).passthrough().refine(
  (c: Record<string, unknown>) => Boolean(c.tex) || Boolean(c.equationHtml),
  { message: 'EquationSlide.content requires `tex` (string) or `equationHtml` (string).' },
);

const DbEntity = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  x: z.number().optional(),
  y: z.number().optional(),
  fields: z.array(z.string()).optional(),
}).passthrough();
const DbRelationship = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
}).passthrough();
const DatabaseDiagramContent = z.object({
  title: z.string().min(1),
  // Either author-laid-out entities (≤5) OR a Mermaid `erDiagram` source string.
  dbEntities: z.array(DbEntity).min(2).max(5).optional(),
  dbRelationships: z.array(DbRelationship).max(6).optional(),
  diagram: z.string().min(10).optional(),
}).passthrough().refine(
  (v) => (v.dbEntities && v.dbEntities.length >= 2) || typeof v.diagram === 'string',
  { message: 'DatabaseDiagramSlide requires either dbEntities[] (≥2) or a Mermaid `diagram` string.' },
);

const ChecklistItem = z.object({
  text: z.string().min(1),
  detail: z.string().max(120).optional(),
  capsule: z.object({
    color: z.enum(['gold', 'ember', 'cream', 'ink', 'outline', 'violet', 'teal', 'rose', 'sky']),
    text: z.string().min(1),
  }).optional(),
}).passthrough();
const ChecklistContent = z.object({
  title: z.string().min(1),
  items: z.array(ChecklistItem).min(2).max(7),
  progressColor: z.enum(['gold', 'ember', 'cream']).optional(),
}).passthrough();

const Tile = z.object({
  name: z.string().min(1),
  tag: z.string().optional(),
  desc: z.string().optional(),
  url: z.string().url().optional(),
  glyph: z.string().optional(),
  cta: z.string().optional(),
}).passthrough();
const TileContent = z.object({
  title: z.string().min(1),
  tiles: z.array(Tile).min(2).max(4),
  tilesCaption: z.string().optional(),
}).passthrough();

/**
 * Public registry of every per-slideType content contract — the SAME zod
 * schemas the runtime validator uses. Exposed so external consumers (the
 * `/settings` JSON-Schema export, future deck editors, CI linters) can
 * derive an up-to-date schema artifact directly from the runtime source of
 * truth, rather than hand-maintaining a parallel JSON Schema that drifts.
 *
 * Bumped via `SLIDE_CONTRACTS_VERSION` whenever any contract here changes
 * shape (added field, tightened bound, new slideType). The version is
 * baked into the exported filename (`slide-types.v{N}.json`) so downstream
 * caches can detect the upgrade automatically.
 */
export const SLIDE_CONTENT_CONTRACTS = {
  TitleSlide:          TitleContent,
  MiddleTitleSlide:    MiddleTitleContent,
  SectionDividerSlide: SectionDividerContent,
  KeywordSlide:        KeywordContent,
  CapsuleListSlide:    CapsuleListContent,
  StepTimelineSlide:   StepTimelineContent,
  FocusTimelineSlide:  FocusTimelineContent,
  AdvanceStepSlide:    AdvanceStepContent,
  StepsChain3DSlide:   StepsChain3DContent,
  ImageSlide:          ImageContent,
  QrMeetingSlide:      QrMeetingContent,
  MetricGridSlide:     MetricGridContent,
  TableSlide:          TableContent,
  CodeBlockSlide:      CodeContent,
  BoxDiagramSlide:     DiagramContent,
  ERDiagramSlide:      ERDiagramContent,
  LayoutSlide:           LayoutContent,
  DatabaseDiagramSlide:  DatabaseDiagramContent,
  DataTableSlide:        DataTableContent,
  NumberCalloutSlide:    NumberCalloutContent,
  EquationSlide:         EquationContent,
  ChecklistSlide:        ChecklistContent,
  TileSlide:             TileContent,
} as const;

/** Bump on any breaking change to a per-type content contract. Drives the
 *  exported artifact's filename (`slide-types.v{N}.json`) and `version`
 *  field so downstream caches know to re-pull. */
export const SLIDE_CONTRACTS_VERSION = 5 as const;

// ---------- Slide envelope (discriminated on slideType) ----------

const Envelope = z.object({
  slideNumber: z.number().int().positive(),
  slideName: z.string().min(1),
  transition: z.string(),
  textAnimation: z.string(),
}).passthrough();

const make = <T extends z.ZodTypeAny>(slideType: string, content: T) =>
  Envelope.extend({ slideType: z.literal(slideType), content });

export const SlideContract = z.discriminatedUnion('slideType', [
  make('TitleSlide', TitleContent),
  make('MiddleTitleSlide', MiddleTitleContent),
  make('SectionDividerSlide', SectionDividerContent),
  make('KeywordSlide', KeywordContent),
  make('CapsuleListSlide', CapsuleListContent),
  make('StepTimelineSlide', StepTimelineContent),
  make('FocusTimelineSlide', FocusTimelineContent),
  make('AdvanceStepSlide', AdvanceStepContent),
  make('StepsChain3DSlide', StepsChain3DContent),
  make('ImageSlide', ImageContent),
  make('QrMeetingSlide', QrMeetingContent),
  make('MetricGridSlide', MetricGridContent),
  make('TableSlide', TableContent),
  make('CodeBlockSlide', CodeContent),
  make('BoxDiagramSlide', DiagramContent),
  make('ERDiagramSlide', ERDiagramContent),
  make('LayoutSlide', LayoutContent),
  make('DatabaseDiagramSlide', DatabaseDiagramContent),
  make('DataTableSlide', DataTableContent),
  make('NumberCalloutSlide', NumberCalloutContent),
  make('EquationSlide', EquationContent),
  make('ChecklistSlide', ChecklistContent),
]);

export interface SlideValidationIssue {
  slideNumber: number | null;
  slideName: string | null;
  slideType: string | null;
  /** Dotted path inside the slide where the failure occurred (e.g. "content.steps"). */
  path: string;
  message: string;
}

/**
 * Validate one slide against its per-type contract. Returns the parsed
 * slide on success or an array of issues (never throws). Fast — uses zod's
 * discriminated union so only the matching contract runs.
 */
export function validateSlide(raw: unknown): { ok: true; slide: SlideSpec } | { ok: false; issues: SlideValidationIssue[] } {
  const result = SlideContract.safeParse(raw);
  if (result.success) return { ok: true, slide: result.data as unknown as SlideSpec };
  const r = raw as Partial<SlideSpec> | null;
  const issues: SlideValidationIssue[] = result.error.issues.map((iss) => ({
    slideNumber: typeof r?.slideNumber === 'number' ? r.slideNumber : null,
    slideName:   typeof r?.slideName === 'string' ? r.slideName : null,
    slideType:   typeof r?.slideType === 'string' ? r.slideType : null,
    path: iss.path.join('.') || '(root)',
    message: iss.message,
  }));
  return { ok: false, issues };
}

/**
 * Validate every slide in a deck. Throws on the FIRST failing slide with
 * a multi-line message naming the slide and every contract violation —
 * matches the project's "fail fast at boot" contract.
 */
export function assertValidSlides(slides: readonly unknown[]): SlideSpec[] {
  const out: SlideSpec[] = [];
  for (const raw of slides) {
    const r = validateSlide(raw);
    if (r.ok === true) {
      out.push(r.slide);
      continue;
    }
    const head = r.issues[0];
    const lines = r.issues.map((i) => `  • ${i.path}: ${i.message}`);
    throw new Error(
      `[deck] Slide #${head.slideNumber ?? '?'} "${head.slideName ?? '?'}" ` +
      `(${head.slideType ?? 'unknown slideType'}) failed contract:\n${lines.join('\n')}`,
    );
  }
  return out;
}


