/**
 * Click-Reveal Dependency Audit (v0.185)
 *
 * Authoring-time analyzer that walks every slide in a deck and produces a
 * dependency graph for **click-reveal** navigation:
 *
 *   - Which slides expose triggers (capsules, steps, step CTAs, hotspots,
 *     CapsuleListSlide CTA) that jump to another slide.
 *   - Which slides are reached only by such triggers (`isClickReveal: true`)
 *     and therefore live outside the linear deck flow.
 *   - Where authors made wiring mistakes:
 *       • trigger points at a missing / disabled / non-reveal slide,
 *       • click-reveal slide is unreachable (no trigger anywhere),
 *       • click-reveal slide is reached from multiple parents (intentional?),
 *       • `parentSlide` declared on the target disagrees with the actual
 *         trigger source(s).
 *
 * # Why a pure analyzer (not a React-only panel)
 * The same data feeds:
 *   1. The on-screen `/click-reveal-audit` page (visual graph + filters).
 *   2. A node CLI (`scripts/audit-click-reveal.ts`) so CI can fail builds
 *      that contain dangling click-reveal targets.
 *   3. Future tests in `src/test/` — pure inputs/outputs are trivial to
 *      assert against fixtures.
 *
 * Inputs are intentionally just `SlideSpec[]` so this module has zero React /
 * routing / loader coupling.
 */
import type { SlideSpec, CapsuleExpandSpec } from './types';

/** Where on a slide a click-reveal trigger lives. Used in audit rows. */
export type TriggerOrigin =
  | 'capsule.clickRevealSlide'
  | 'capsule.expand'
  | 'step.revealSlide'
  | 'step.expand'
  | 'step.cta.revealSlide'
  | 'hotspot.revealSlide'
  | 'hotspot.expand'
  | 'slide.cta.onClickRevealSlide';

export interface ClickRevealTriggerEntry {
  /** Slide hosting the trigger (the "parent"). */
  sourceSlideNumber: number;
  /** Display name for the source slide (slide.slideName or fallback). */
  sourceSlideName: string;
  /** Which field on the source slide produced this trigger. */
  origin: TriggerOrigin;
  /** Human-readable label for the trigger element ("Capsule: Strategy"). */
  triggerLabel: string;
  /**
   * Target slide number. `null` for `expand` triggers — those reveal an
   * inline card, not another slide, but we still surface them so authors can
   * see the full interactive surface area on a slide.
   */
  targetSlideNumber: number | null;
  /** True when the trigger opens an inline expanding card instead of jumping. */
  isInlineExpand: boolean;
}

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface ClickRevealIssue {
  severity: IssueSeverity;
  /** Stable code so tests / CI can assert specific failures. */
  code:
    | 'missing-target'
    | 'disabled-target'
    | 'target-not-marked-click-reveal'
    | 'click-reveal-unreachable'
    | 'click-reveal-multiple-parents'
    | 'parent-slide-mismatch'
    | 'inline-expand-no-payload';
  message: string;
  /** Optional source slide context. */
  sourceSlideNumber?: number;
  /** Optional target slide context. */
  targetSlideNumber?: number;
  /** Optional trigger origin context. */
  origin?: TriggerOrigin;
}

export interface ClickRevealSlideSummary {
  slideNumber: number;
  slideName: string;
  /** Authored `parentSlide` value, if any. */
  declaredParent: number | null;
  /** Slide numbers that actually link to this slide via a trigger. */
  actualParents: number[];
  /** True when no trigger anywhere targets this click-reveal slide. */
  isOrphaned: boolean;
}

export interface ClickRevealAuditReport {
  /** Every trigger discovered, in source-slide order then origin order. */
  triggers: ClickRevealTriggerEntry[];
  /** Every slide marked `isClickReveal: true`, with parent reachability. */
  clickRevealSlides: ClickRevealSlideSummary[];
  /** Authoring problems detected. Empty array = clean. */
  issues: ClickRevealIssue[];
  /** Counts for at-a-glance summary chips. */
  stats: {
    totalSlides: number;
    totalClickRevealSlides: number;
    totalTriggers: number;
    totalNavigatingTriggers: number;
    totalInlineExpandTriggers: number;
    orphanedClickRevealSlides: number;
    errors: number;
    warnings: number;
  };
}

function slideLabel(s: SlideSpec): string {
  return s.slideName || s.content.title || `Slide ${s.slideNumber}`;
}

function expandHasPayload(expand: CapsuleExpandSpec | undefined): boolean {
  if (!expand) return false;
  // CapsuleExpandSpec body shape varies (title/description/etc). Treat any
  // non-empty object as a valid payload — the renderer falls back to the
  // host element's text otherwise.
  return Object.keys(expand).length > 0;
}

/**
 * Walk a deck and produce the full click-reveal dependency report.
 * Pure function — no I/O, no globals, safe to call from tests / scripts /
 * React components alike.
 */
export function auditClickRevealDependencies(slides: SlideSpec[]): ClickRevealAuditReport {
  const triggers: ClickRevealTriggerEntry[] = [];
  const issues: ClickRevealIssue[] = [];
  const slideByNumber = new Map<number, SlideSpec>(slides.map((s) => [s.slideNumber, s]));

  function pushTrigger(entry: ClickRevealTriggerEntry) {
    triggers.push(entry);
  }

  // -- Pass 1: collect every trigger from every slide. ----------------------
  for (const slide of slides) {
    const sourceSlideNumber = slide.slideNumber;
    const sourceSlideName = slideLabel(slide);
    const c = slide.content;

    // Capsules — `clickRevealSlide` (legacy) and `expand` (modern).
    c.capsules?.forEach((cap, idx) => {
      const label = `Capsule “${cap.text || `#${idx + 1}`}”`;
      if (typeof cap.clickRevealSlide === 'number') {
        pushTrigger({
          sourceSlideNumber,
          sourceSlideName,
          origin: 'capsule.clickRevealSlide',
          triggerLabel: label,
          targetSlideNumber: cap.clickRevealSlide,
          isInlineExpand: false,
        });
      }
      if (cap.expand) {
        pushTrigger({
          sourceSlideNumber,
          sourceSlideName,
          origin: 'capsule.expand',
          triggerLabel: `${label} → inline card`,
          targetSlideNumber: null,
          isInlineExpand: true,
        });
        if (!expandHasPayload(cap.expand)) {
          issues.push({
            severity: 'warning',
            code: 'inline-expand-no-payload',
            message: `${label} on slide ${sourceSlideNumber} sets \`expand\` but has no payload fields.`,
            sourceSlideNumber,
            origin: 'capsule.expand',
          });
        }
      }
    });

    // Steps — `revealSlide`, `expand`, and per-step CTA `revealSlide`.
    c.steps?.forEach((step, idx) => {
      const label = `Step ${idx + 1}: “${step.title || step.label || ''}”`;
      if (typeof step.revealSlide === 'number') {
        pushTrigger({
          sourceSlideNumber,
          sourceSlideName,
          origin: 'step.revealSlide',
          triggerLabel: label,
          targetSlideNumber: step.revealSlide,
          isInlineExpand: false,
        });
      }
      if (step.expand) {
        pushTrigger({
          sourceSlideNumber,
          sourceSlideName,
          origin: 'step.expand',
          triggerLabel: `${label} → inline card`,
          targetSlideNumber: null,
          isInlineExpand: true,
        });
      }
      if (step.cta && typeof step.cta.revealSlide === 'number') {
        pushTrigger({
          sourceSlideNumber,
          sourceSlideName,
          origin: 'step.cta.revealSlide',
          triggerLabel: `${label} CTA “${step.cta.text}”`,
          targetSlideNumber: step.cta.revealSlide,
          isInlineExpand: false,
        });
      }
    });

    // Hotspots — `revealSlide` and `expand`.
    c.hotspots?.forEach((hs, idx) => {
      const label = `Hotspot #${idx + 1}${hs.label ? ` (${hs.label})` : ''}`;
      if (typeof hs.revealSlide === 'number') {
        pushTrigger({
          sourceSlideNumber,
          sourceSlideName,
          origin: 'hotspot.revealSlide',
          triggerLabel: label,
          targetSlideNumber: hs.revealSlide,
          isInlineExpand: false,
        });
      }
      if (hs.expand) {
        pushTrigger({
          sourceSlideNumber,
          sourceSlideName,
          origin: 'hotspot.expand',
          triggerLabel: `${label} → inline card`,
          targetSlideNumber: null,
          isInlineExpand: true,
        });
      }
    });

    // Slide-level CTA on CapsuleListSlide (`onClickRevealSlide`).
    if (c.cta && typeof (c.cta as { onClickRevealSlide?: number }).onClickRevealSlide === 'number') {
      const target = (c.cta as { onClickRevealSlide?: number }).onClickRevealSlide!;
      pushTrigger({
        sourceSlideNumber,
        sourceSlideName,
        origin: 'slide.cta.onClickRevealSlide',
        triggerLabel: `Slide CTA “${(c.cta as { text?: string }).text || ''}”`,
        targetSlideNumber: target,
        isInlineExpand: false,
      });
    }
  }

  // -- Pass 2: validate every navigating trigger against the deck. ----------
  for (const t of triggers) {
    if (t.targetSlideNumber == null) continue;
    const target = slideByNumber.get(t.targetSlideNumber);
    if (!target) {
      issues.push({
        severity: 'error',
        code: 'missing-target',
        message: `${t.triggerLabel} on slide ${t.sourceSlideNumber} points at slide ${t.targetSlideNumber}, which does not exist.`,
        sourceSlideNumber: t.sourceSlideNumber,
        targetSlideNumber: t.targetSlideNumber,
        origin: t.origin,
      });
      continue;
    }
    if (target.enabled === false) {
      issues.push({
        severity: 'error',
        code: 'disabled-target',
        message: `${t.triggerLabel} on slide ${t.sourceSlideNumber} points at slide ${t.targetSlideNumber}, which is disabled (\`enabled: false\`).`,
        sourceSlideNumber: t.sourceSlideNumber,
        targetSlideNumber: t.targetSlideNumber,
        origin: t.origin,
      });
      continue;
    }
    if (!target.isClickReveal) {
      issues.push({
        severity: 'warning',
        code: 'target-not-marked-click-reveal',
        message: `${t.triggerLabel} on slide ${t.sourceSlideNumber} jumps to slide ${t.targetSlideNumber}, but that slide is in the linear flow (\`isClickReveal\` is false). The audience will see it twice — once linearly, once on click.`,
        sourceSlideNumber: t.sourceSlideNumber,
        targetSlideNumber: t.targetSlideNumber,
        origin: t.origin,
      });
    }
  }

  // -- Pass 3: build per-click-reveal-slide summary + orphan/parent checks.--
  const navigatingTriggers = triggers.filter((t) => t.targetSlideNumber != null);
  const parentsByTarget = new Map<number, Set<number>>();
  for (const t of navigatingTriggers) {
    const tgt = t.targetSlideNumber!;
    if (!parentsByTarget.has(tgt)) parentsByTarget.set(tgt, new Set());
    parentsByTarget.get(tgt)!.add(t.sourceSlideNumber);
  }

  const clickRevealSlides: ClickRevealSlideSummary[] = slides
    .filter((s) => s.isClickReveal === true)
    .map((s) => {
      const declaredParent = typeof s.parentSlide === 'number' ? s.parentSlide : null;
      const actualParents = Array.from(parentsByTarget.get(s.slideNumber) ?? []).sort((a, b) => a - b);
      const isOrphaned = actualParents.length === 0;
      return {
        slideNumber: s.slideNumber,
        slideName: slideLabel(s),
        declaredParent,
        actualParents,
        isOrphaned,
      };
    })
    .sort((a, b) => a.slideNumber - b.slideNumber);

  for (const summary of clickRevealSlides) {
    if (summary.isOrphaned) {
      issues.push({
        severity: 'error',
        code: 'click-reveal-unreachable',
        message: `Slide ${summary.slideNumber} (“${summary.slideName}”) is marked \`isClickReveal: true\` but no trigger anywhere in the deck points to it. It is unreachable.`,
        targetSlideNumber: summary.slideNumber,
      });
      continue;
    }
    if (summary.actualParents.length > 1) {
      issues.push({
        severity: 'info',
        code: 'click-reveal-multiple-parents',
        message: `Slide ${summary.slideNumber} (“${summary.slideName}”) is reached from multiple parent slides: [${summary.actualParents.join(', ')}]. Confirm this is intentional — back-navigation will use \`parentSlide\` only.`,
        targetSlideNumber: summary.slideNumber,
      });
    }
    if (
      summary.declaredParent != null &&
      !summary.actualParents.includes(summary.declaredParent)
    ) {
      issues.push({
        severity: 'warning',
        code: 'parent-slide-mismatch',
        message: `Slide ${summary.slideNumber} declares \`parentSlide: ${summary.declaredParent}\`, but no trigger on slide ${summary.declaredParent} points back to it. Actual triggers come from: [${summary.actualParents.join(', ') || 'none'}].`,
        targetSlideNumber: summary.slideNumber,
      });
    }
  }

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const orphanedClickRevealSlides = clickRevealSlides.filter((s) => s.isOrphaned).length;

  return {
    triggers,
    clickRevealSlides,
    issues,
    stats: {
      totalSlides: slides.length,
      totalClickRevealSlides: clickRevealSlides.length,
      totalTriggers: triggers.length,
      totalNavigatingTriggers: navigatingTriggers.length,
      totalInlineExpandTriggers: triggers.filter((t) => t.isInlineExpand).length,
      orphanedClickRevealSlides,
      errors,
      warnings,
    },
  };
}

/**
 * Render a compact, copy-pasteable text report for terminals / GitHub
 * comments. Sorted for deterministic diffs.
 */
export function formatClickRevealReport(report: ClickRevealAuditReport): string {
  const lines: string[] = [];
  const { stats } = report;
  lines.push('Click-Reveal Dependency Report');
  lines.push('================================');
  lines.push(`Slides: ${stats.totalSlides}  ·  Click-reveal slides: ${stats.totalClickRevealSlides}  ·  Orphaned: ${stats.orphanedClickRevealSlides}`);
  lines.push(`Triggers: ${stats.totalTriggers} (nav: ${stats.totalNavigatingTriggers}, inline-expand: ${stats.totalInlineExpandTriggers})`);
  lines.push(`Errors: ${stats.errors}  ·  Warnings: ${stats.warnings}`);
  lines.push('');

  if (report.clickRevealSlides.length > 0) {
    lines.push('Click-reveal targets (target ← parents)');
    lines.push('---------------------------------------');
    for (const s of report.clickRevealSlides) {
      const parents = s.actualParents.length ? s.actualParents.join(', ') : '— ORPHAN';
      const declared = s.declaredParent != null ? ` [declared parent: ${s.declaredParent}]` : '';
      lines.push(`  ${String(s.slideNumber).padStart(3)} “${s.slideName}” ← [${parents}]${declared}`);
    }
    lines.push('');
  }

  if (report.triggers.length > 0) {
    lines.push('Triggers (source → target)');
    lines.push('--------------------------');
    const sorted = [...report.triggers].sort(
      (a, b) =>
        a.sourceSlideNumber - b.sourceSlideNumber ||
        a.origin.localeCompare(b.origin),
    );
    for (const t of sorted) {
      const arrow = t.isInlineExpand ? '⇲ inline-expand' : `→ slide ${t.targetSlideNumber}`;
      lines.push(`  ${String(t.sourceSlideNumber).padStart(3)} [${t.origin}] ${t.triggerLabel}  ${arrow}`);
    }
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('Issues');
    lines.push('------');
    for (const issue of report.issues) {
      const tag = issue.severity.toUpperCase().padEnd(7);
      lines.push(`  [${tag}] (${issue.code}) ${issue.message}`);
    }
  } else {
    lines.push('No issues. ✓');
  }

  return lines.join('\n');
}
