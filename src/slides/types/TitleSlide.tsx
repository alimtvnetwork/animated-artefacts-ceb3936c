/**
 * Hero TitleSlide — radial amber glow + scattered drifting line-art icons.
 *
 * v0.36 — fully delegates the background field to `<AmbientBackground>` so
 * it stays in sync with the StepTimeline glow recipe. Per spec 30 §2.7 the
 * homepage runs at higher icon density (18) and higher opacity (0.10) than
 * the deck-wide default — the icons must be visible on a 1080p projector.
 *
 * Layers:
 *   1. `bg-background` (handled by SlideStage / page).
 *   2. AmbientBackground — soft radial glow + drifting icon field +
 *      cursor parallax. Lives entirely inside the component.
 *   3. Centered eyebrow / title / subtitle / capsules block.
 *
 * See `spec/slides/15-title-slide-v2.md`, `spec/slides/30-fullscreen-layout-polish.md`
 * and `mem://design/hero-fullscreen`.
 */
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  Book, Clipboard, FileText, GitBranch, MessageSquare,
  UserCheck, Users, Video, Code2, Terminal, Boxes, Cloud,
} from 'lucide-react';
import type { SlideSpec } from '../types';
import { resolvePreset, TEXT_ANIMATION_PRESETS } from '../textAnimations';
import { titleClassFor } from '../preset';
import { Capsule } from '../components/Capsule';
import { AmbientBackground } from '../components/AmbientBackground';
import { VSCodeIcon, GitHubMarkIcon, JetBrainsIcon, FigmaIcon } from '../components/BrandIcons';
import { resolveIconSlugs, AMBIENT_ICON_REGISTRY, AMBIENT_DEFAULT_BRAND_COLORS } from '../ambientIconRegistry';

// v0.45 — homepage ambient field with FOUR real-brand accents (VS Code,
// GitHub, JetBrains, Figma). The brand-icon indexes (12–15) are ALL in
// `floatIndexes` so they auto-bob even with no mouse movement, on top
// of the deck-wide Lissajous sway from v0.43. Result: the homepage feels
// alive on first arrival, with 1–2 colored marks anchoring the field.
const HOME_ICONS = [
  FileText, Video, MessageSquare, Clipboard, UserCheck, Book, GitBranch, Users,
  Code2, Terminal, Boxes, Cloud,
  VSCodeIcon, GitHubMarkIcon, JetBrainsIcon, FigmaIcon,
];
const HOME_ACCENTS: Record<number, string> = {
  12: '#007ACC',           // VS Code blue
  13: '#FFFFFF',           // hardcoded-white-ok: GitHub mark glyph stays white so the gold halo ties it in
  14: '#FF318C',           // JetBrains magenta
  15: '#F24E1E',           // Figma orange — `color` is ignored (multi-color SVG)
};

// Spec 31 §5 — canonical step-timeline delays (seconds). Authored as
// constants so the rhythm is identical regardless of which blocks are
// rendered. NEVER drive these via container stagger — explicit delays
// survive conditional rendering and reduced-motion swaps.
const DELAY = {
  glow: 0.20,
  eyebrow: 0.25,
  title: 0.40,
  subtitle: 0.85,
  capsulesBase: 1.10,
  capsuleStep: 0.09,
} as const;

/** Merge a per-block delay into a Variants object without mutating it. */
function withDelay(v: Variants, delay: number): Variants {
  const animate = v.animate as Record<string, unknown> | undefined;
  const existing = (animate?.transition ?? {}) as Record<string, unknown>;
  return {
    ...v,
    animate: {
      ...(animate ?? {}),
      transition: { ...existing, delay },
    },
  };
}

export function TitleSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();

  // Spec 31 §7 — when reduced motion is on, swap every variant for the
  // cheap `reducedFade` preset but keep the delay schedule so the audience
  // still perceives the step-timeline cascade.
  const baseFor = (
    override: Parameters<typeof resolvePreset>[0],
    fallback: keyof typeof TEXT_ANIMATION_PRESETS,
  ) => (reduced ? TEXT_ANIMATION_PRESETS.reducedFade : resolvePreset(override, fallback));

  const eyebrowV  = withDelay(baseFor(c.animations?.eyebrow,  'fadeIn'),            DELAY.eyebrow);
  const titleV    = withDelay(baseFor(c.animations?.title,    'titleSlide'),        DELAY.title);
  const subtitleV = withDelay(baseFor(c.animations?.subtitle, 'fadeIn'),            DELAY.subtitle);
  const capsuleBaseV = baseFor(c.animations?.capsules, 'cinematicCapsules');

  // v0.83 — JSON-driven hero ambient. When `content.titleAmbient` is set,
  // the deck pins exactly which icons render, where, and at what density.
  // Otherwise we fall back to the legacy HOME_ICONS / HOME_ACCENTS field.
  const authored = c.titleAmbient;
  const authoredPool = authored?.iconPool ? resolveIconSlugs(authored.iconPool) : null;
  const authoredExplicit = authored?.positions && authored.positions.length > 0
    ? authored.positions.map((p) => ({
        Icon: AMBIENT_ICON_REGISTRY[p.icon] ?? FileText,
        top: p.top,
        left: p.left,
        size: p.size,
        accent: p.accent ?? AMBIENT_DEFAULT_BRAND_COLORS[p.icon],
        float: p.float,
      }))
    : undefined;
  const ambientIcons = authoredPool && authoredPool.length > 0 ? authoredPool : HOME_ICONS;
  const ambientAccents: Record<number, string> = (() => {
    if (authored?.accents) {
      const out: Record<number, string> = {};
      for (const [k, v] of Object.entries(authored.accents)) {
        const n = Number(k);
        if (!Number.isNaN(n)) out[n] = v;
      }
      return out;
    }
    return HOME_ACCENTS;
  })();

  // Glow/icon ambient layer fades in slightly before the title beat.
  // AmbientBackground reads its own internal timing; we just gate visibility
  // via opacity transition wrapper so the cascade still starts on the glow.
  return (
    <div className="relative h-full w-full overflow-hidden">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.8, ease: 'easeOut', delay: DELAY.glow }}
      >
        <AmbientBackground
          seed={`title-${c.title ?? 'home'}`}
          icons={ambientIcons}
          count={authored?.count ?? 16}
          opacity={authored?.opacity ?? 0.18}
          drift={authored?.drift ?? 0.6}
          parallax={authored?.parallax ?? 24}
          glow={authored?.glow ?? true}
          accentColors={ambientAccents}
          // All 4 brand-icon slots (12-15) auto-float, plus a few neutral
          // icons across the field so the bob isn't concentrated in the
          // brand cluster.
          floatIndexes={authored?.floatIndexes ?? [1, 3, 6, 9, 12, 13, 14, 15]}
          sizeRange={authored?.sizeRange}
          explicitPositions={authoredExplicit}
        />
      </motion.div>

      {/* Layer 3 — content. No container variants: each block animates on
          its own timeline per spec 31 §5. */}
      <div className="relative flex h-full flex-col items-center justify-center text-center px-8 pt-32 pb-20">
        {c.eyebrow && (
          <motion.span
            variants={eyebrowV}
            initial="initial"
            animate="animate"
            className="slide-eyebrow mb-6"
          >
            {c.eyebrow}
          </motion.span>
        )}
        {c.title && (
          <motion.h1
            variants={titleV}
            initial="initial"
            animate="animate"
            className={`slide-title-display whitespace-pre-line leading-[0.95] ${titleClassFor(spec)}`}
            style={{ fontSize: 'clamp(3rem, 8.5vw, 9rem)' }}
          >
            {c.title}
          </motion.h1>
        )}
        {c.subtitle && (
          <motion.p
            variants={subtitleV}
            initial="initial"
            animate="animate"
            className="slide-subtitle mt-8 max-w-2xl"
            style={{ color: 'hsl(var(--cream) / 0.85)' }}
          >
            {c.subtitle}
          </motion.p>
        )}
        {c.capsules && (
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            {c.capsules.map((cap, i) => (
              <motion.div
                key={i}
                variants={withDelay(capsuleBaseV, DELAY.capsulesBase + i * DELAY.capsuleStep)}
                initial="initial"
                animate="animate"
              >
                <Capsule spec={cap} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
