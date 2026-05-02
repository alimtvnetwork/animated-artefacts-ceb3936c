/**
 * MiddleTitleSlide — section-break / interlude slide.
 *
 * Spec:   `spec/slides/26-middle-title-slide.md`.
 * Memory: (new) — bumped from the existing TitleSlide v2 recipe but
 * deliberately calmer (tighter spotlight, smaller title, no capsules).
 *
 * # Layers (back → front)
 *   1. `bg-background` (handled by SlideStage; this component does NOT
 *      redeclare it).
 *   2. Warm radial spotlight centered at 50% 50%. Tighter than the hero
 *      `TitleSlide` glow so the eye snaps to the title immediately.
 *   3. `<AmbientBackground>` with the productivity icon set, widened
 *      safe-zone so no icon ever sits behind the title.
 *   4. Centered eyebrow / gold title / gray subtitle stack.
 *
 * Used between deck chapters as a "pause and seed the next idea"
 * moment ("Meet the Team", "Now — about pricing", etc.).
 *
 * All motion respects `prefers-reduced-motion`.
 */
import { motion, useReducedMotion } from 'framer-motion';
import {
  Book, Clipboard, FileText, GitBranch, MessageSquare, UserCheck, Users, Video,
} from 'lucide-react';
import type { SlideSpec } from '../types';
import { AmbientBackground } from '../components/AmbientBackground';

// Productivity preset (matches the hero TitleSlide vibe). Kept inline so
// this slide doesn't pull in the full `ambientPresets` resolver — its
// icon set is fixed by spec, not user-configurable.
const PRODUCTIVITY_ICONS = [
  FileText, Video, MessageSquare, Clipboard, UserCheck, Book, GitBranch, Users,
];

export function MiddleTitleSlide({ spec }: { spec: SlideSpec }) {
  const reduced = useReducedMotion();
  const c = spec.content;

  // Expo-out — same easing as the contact card and StepTimeline v3 so the
  // deck has a coherent motion vocabulary across "calm" moments.
  const EXPO_OUT: [number, number, number, number] = [0.19, 1, 0.22, 1];

  // Stable seed so the icon scatter is identical every render (incl.
  // theme swap). Falls back to title to keep the field deterministic
  // even when authors forget to set `slideName`.
  const seed = `middle-title-${spec.slideName ?? c.title ?? spec.slideNumber}`;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Layer 2 — warm radial spotlight. `--gold` HSL channels at low alpha
          so theme swaps automatically retune the glow. `pointer-events: none`
          so the title underneath stays interactive (slide-jump shortcuts). */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 1.0, ease: 'easeOut' }
        }
        style={{
          background: `radial-gradient(
            ellipse 50% 38% at 50% 50%,
            hsl(var(--gold) / 0.18) 0%,
            hsl(28 75% 11% / 0.55) 35%,
            transparent 65%
          )`,
        }}
      />

      {/* Layer 3 — ambient icon scatter. Wider safe-zone (36×36 vs the
          default 30×30) so even a long title never overlaps an icon.
          `parallax: 14` gives the field gentle depth without competing
          with the title for attention. */}
      <AmbientBackground
        seed={seed}
        icons={PRODUCTIVITY_ICONS}
        count={12}
        opacity={0.05}
        drift={0.35}
        parallax={14}
        safeZone={{ x: 36, y: 36 }}
      />

      {/* Layer 4 — content stack. Centered both axes; max-width clamps
          long titles so they wrap before reaching the icon zone. */}
      <div className="relative h-full w-full flex flex-col items-center justify-center text-center px-12">
        <div className="w-full" style={{ maxWidth: 'min(80%, 1280px)' }}>
          {c.eyebrow && (
            <motion.span
              className="slide-eyebrow block mb-4"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduced
                  ? { duration: 0.4, delay: 0.1, ease: 'easeOut' }
                  : { duration: 0.6, delay: 0.15, ease: EXPO_OUT }
              }
            >
              {c.eyebrow}
            </motion.span>
          )}
          {c.title && (
            <motion.h1
              className="slide-title-display whitespace-pre-line"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduced
                  ? { duration: 0.4, delay: 0.2, ease: 'easeOut' }
                  : { duration: 0.85, delay: 0.30, ease: EXPO_OUT }
              }
              style={{
                color: 'hsl(var(--gold))',
                fontWeight: 700,
                fontSize: 'clamp(3rem, 6vw, 5rem)',
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              {c.title}
            </motion.h1>
          )}
          {c.subtitle && (
            <motion.p
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduced
                  ? { duration: 0.4, delay: 0.3, ease: 'easeOut' }
                  : { duration: 0.7, delay: 0.55, ease: EXPO_OUT }
              }
              style={{
                color: 'hsl(var(--foreground) / 0.75)',
                fontWeight: 400,
                fontSize: 'clamp(1rem, 1.4vw, 1.5rem)',
                marginTop: 16,
              }}
            >
              {c.subtitle}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
