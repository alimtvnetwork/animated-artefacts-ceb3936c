import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec, TileSpec } from '../types';
import { titleClassFor } from '../preset';

/**
 * TileSlide — N clickable cards in a row.
 *
 * Use for: project lists, repo links, resource showcases. Each tile is
 * a full-card external link with glyph + name + tag + description + CTA.
 *
 * Spec: `updates/spec/05-tile-slide.md`. House rules:
 *  - 2–4 tiles per row (auto-derived grid).
 *  - Glyph = single emoji or 1–2 char string.
 *  - All colors via tokens (gold, foreground, muted-foreground, card).
 *  - Stagger entry by `i * 150ms`.
 */
function gridClassFor(count: number): string {
  if (count <= 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-3';
  return 'grid-cols-4';
}

export function TileSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const tiles = (c.tiles ?? []) as TileSpec[];
  const caption = c.tilesCaption;

  return (
    <section
      role="region"
      aria-label={`Tiles: ${c.title ?? spec.slideName}`}
      className="relative h-full w-full overflow-hidden flex flex-col px-24 pt-32 pb-20"
    >
      <header className="mb-8">
        {c.eyebrow && <p className="slide-eyebrow mb-3">{c.eyebrow}</p>}
        {c.title && <h2 className={`slide-title-content ${titleClassFor(spec)}`}>{c.title}</h2>}
        {c.subtitle && <p className="slide-subtitle mt-3">{c.subtitle}</p>}
      </header>

      <div className={`flex-1 grid ${gridClassFor(tiles.length)} gap-6 content-center`}>
        {tiles.map((t, i) => {
          const Wrapper: React.ElementType = t.url ? 'a' : 'div';
          const linkProps = t.url
            ? { href: t.url, target: '_blank', rel: 'noopener noreferrer' }
            : {};
          return (
            <motion.div
              key={`${t.name}-${i}`}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
                delay: reduced ? 0 : i * 0.15,
              }}
            >
              <Wrapper
                {...linkProps}
                className="tile-card group relative block p-7 rounded-2xl overflow-hidden h-full"
              >
                <div className="tile-card__glow" aria-hidden="true" />
                <div className="relative">
                  {t.glyph && (
                    <div className="text-5xl mb-5 inline-block transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                      {t.glyph}
                    </div>
                  )}
                  <div className="font-display text-3xl font-bold mb-1 text-foreground">{t.name}</div>
                  {t.tag && (
                    <div className="text-xs uppercase tracking-widest text-gold/70 font-mono mb-4">
                      {t.tag}
                    </div>
                  )}
                  {t.desc && (
                    <p className="text-sm leading-relaxed text-foreground/65 mb-6">{t.desc}</p>
                  )}
                  {t.url && (
                    <div className="flex items-center gap-2 text-sm text-gold transition-all duration-300 group-hover:gap-4">
                      <span>{t.cta ?? 'View on GitHub'}</span>
                      <span aria-hidden="true">→</span>
                    </div>
                  )}
                </div>
              </Wrapper>
            </motion.div>
          );
        })}
      </div>

      {caption && (
        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: reduced ? 0 : 0.7 }}
          className="mt-8 text-center text-sm italic text-foreground/55"
        >
          {caption}
        </motion.p>
      )}
    </section>
  );
}
