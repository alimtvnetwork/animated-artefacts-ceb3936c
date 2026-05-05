import { motion } from 'framer-motion';
import type { SlideSpec } from '../types';
import { getContainerVariants, getItemVariants, resolvePreset } from '../textAnimations';
import { titleClassFor } from '../preset';
import { Capsule } from '../components/Capsule';

/**
 * SessionOutlineSlide — vertical numbered agenda.
 *
 * Layout: title block (eyebrow + title + optional kicker) at the top of the
 * stage; below, a vertical list of 3–8 outline rows. Each row is:
 *
 *   ┌─ 01 ─┬─ Recap ──────────────────────── ──┬─ [5 min]
 *   │ idx  │ title (Ubuntu Bold)               │ meta capsule
 *   │      │ subtitle / one-line desc (Inter)  │
 *   └──────┴────────────────────────────────────┴────────
 *
 * - The big index numeral lives in a fixed-width gutter so titles align.
 * - A single vertical hairline glows at the active row (driven by
 *   `content.activeIndex`, defaulting to none).
 * - Reveal is staggered top-to-bottom via the existing text-animation
 *   container variants, so it inherits whatever preset the slide picks.
 *
 * Required content: `title` + `items[]` (min 2, max 8). Each item:
 *   { title, subtitle?, meta?, capsule? }
 *
 * Pairs naturally with `BlastRadiusSlide` as a chapter opener: blast →
 * outline → first content slide.
 *
 * See `spec/26-slide-definitions/_patterns/session-outline-slide.md`.
 */
export function SessionOutlineSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content as {
    eyebrow?: string;
    title: string;
    kicker?: string;
    items: Array<{
      title: string;
      subtitle?: string;
      meta?: string;
      capsule?: { text: string; color: string };
    }>;
    activeIndex?: number;
    animations?: {
      eyebrow?: string;
      title?: string;
      kicker?: string;
      items?: string;
    };
  };
  const container = getContainerVariants(spec.textAnimation);
  const defaultItem = getItemVariants(spec.textAnimation);
  const eyebrowV = c.animations?.eyebrow ? resolvePreset(c.animations.eyebrow) : defaultItem;
  const titleV   = c.animations?.title   ? resolvePreset(c.animations.title)   : defaultItem;
  const kickerV  = c.animations?.kicker  ? resolvePreset(c.animations.kicker)  : defaultItem;
  const itemsV   = c.animations?.items   ? resolvePreset(c.animations.items)   : defaultItem;
  const titleColor = titleClassFor(spec);
  const items = Array.isArray(c.items) ? c.items : [];
  const active = typeof c.activeIndex === 'number' ? c.activeIndex : -1;

  return (
    <motion.div
      variants={container}
      initial="initial"
      animate="animate"
      className="flex h-full flex-col"
      style={{
        paddingLeft: 'var(--brand-inset-x)',
        paddingRight: 'var(--brand-inset-x)',
        paddingTop: 'var(--brand-inset-y)',
        paddingBottom: 'calc(var(--brand-inset-y) * 0.6)',
      }}
    >
      {/* ── Header block ──────────────────────────────────── */}
      <div className="mb-12">
        {c.eyebrow && (
          <motion.div
            variants={eyebrowV}
            className="slide-eyebrow text-xs tracking-[0.4em] uppercase text-gold/90 mb-4"
          >
            {c.eyebrow}
          </motion.div>
        )}
        {c.title && (
          <motion.h2
            variants={titleV}
            className={`slide-title-content ${titleColor}`}
            style={{ lineHeight: 1.05 }}
          >
            {c.title}
          </motion.h2>
        )}
        {c.kicker && (
          <motion.p
            variants={kickerV}
            className="mt-3 text-base text-white/55"
            style={{ maxWidth: '60ch' }}
          >
            {c.kicker}
          </motion.p>
        )}
      </div>

      {/* ── Outline list ──────────────────────────────────── */}
      <div className="relative flex-1 flex flex-col justify-center">
        {/* Continuous vertical hairline behind the numerals (sits inside the
            index gutter). Lights up at the active index. */}
        <div
          aria-hidden
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: '40px',
            width: '1px',
            background:
              'linear-gradient(to bottom, transparent 0%, hsl(var(--gold) / 0.18) 12%, hsl(var(--gold) / 0.18) 88%, transparent 100%)',
          }}
        />
        <motion.ol variants={itemsV} className="relative flex flex-col gap-6">
          {items.map((it, i) => {
            const isActive = i === active;
            const idxLabel = String(i + 1).padStart(2, '0');
            return (
              <motion.li
                key={i}
                variants={itemsV}
                className="grid items-center gap-6 group"
                style={{
                  gridTemplateColumns: '88px 1fr auto',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  borderTop: i === 0 ? '1px solid hsl(var(--gold) / 0.10)' : undefined,
                  borderBottom: '1px solid hsl(var(--gold) / 0.10)',
                  opacity: active >= 0 && !isActive ? 0.55 : 1,
                  transition: 'opacity 240ms ease-out',
                }}
              >
                {/* Index numeral */}
                <div
                  className="font-display tabular-nums leading-none"
                  style={{
                    fontSize: 'clamp(2.4rem, 4.4vw, 3.8rem)',
                    color: isActive ? 'hsl(var(--gold))' : 'hsl(var(--gold) / 0.55)',
                    textShadow: isActive
                      ? '0 0 28px hsl(var(--gold) / 0.45)'
                      : 'var(--text-shadow-weight-md)',
                    transition: 'color 240ms ease-out, text-shadow 240ms ease-out',
                  }}
                >
                  {idxLabel}
                </div>

                {/* Title + subtitle column */}
                <div className="flex flex-col">
                  <div
                    className="font-display step-title"
                    style={{
                      fontSize: 'clamp(1.75rem, 2.6vw, 2.4rem)',
                      lineHeight: 1.15,
                      color: 'hsl(var(--white))',
                    }}
                  >
                    {it.title}
                  </div>
                  {it.subtitle && (
                    <div
                      className="mt-1 text-white/60"
                      style={{ fontSize: 'clamp(1rem, 1.15vw, 1.15rem)', lineHeight: 1.35 }}
                    >
                      {it.subtitle}
                    </div>
                  )}
                </div>

                {/* Meta column — capsule (preferred) OR plain meta text */}
                <div className="flex items-center gap-3 justify-self-end">
                  {it.capsule && <Capsule spec={it.capsule as never} />}
                  {it.meta && !it.capsule && (
                    <span className="capsule-meta">{it.meta}</span>
                  )}
                  {it.meta && it.capsule && (
                    <span className="capsule-meta">{it.meta}</span>
                  )}
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </motion.div>
  );
}
