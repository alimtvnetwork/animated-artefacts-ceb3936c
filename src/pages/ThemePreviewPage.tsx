/**
 * /theme-preview — instant theme switcher with live typography/capsule preview.
 *
 * Authoring tool. Lets the operator click any registered theme and see, in
 * one viewport, how the four key surfaces of every slide read in that
 * palette: display title, eyebrow, body paragraph, and the full capsule
 * family (gold / ember / cream / ink / outline / violet / teal / rose / sky).
 *
 * Why a dedicated page instead of just the existing ThemeMenu in the
 * controller: the menu only shows swatches — there is no way to see *typed
 * content* across themes without flipping the entire deck. This page exists
 * to A/B palettes against canonical Riseup copy without leaving the chrome.
 *
 * The page uses the same `setTheme()` API as the controller's ThemeMenu, so
 * a choice made here persists (localStorage) and broadcasts to peer windows
 * just like the production picker. A `Restore` button captures the boot
 * theme on mount and lets the user roll back without remembering which one
 * was active.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, RotateCcw } from 'lucide-react';
import { THEMES, THEME_IDS, getStoredTheme, setTheme, type ThemeId } from '@/slides/themes';

/** Canonical capsule variants advertised by the design system (index.css). */
const CAPSULE_VARIANTS = [
  'gold', 'ember', 'cream', 'ink', 'outline',
  'violet', 'teal', 'rose', 'sky',
] as const;

export default function ThemePreviewPage() {
  // Capture the theme that was active when the page mounted, so "Restore"
  // can return to it regardless of how many previews the user clicked
  // through. Read via getStoredTheme to avoid coupling to React state in
  // upstream theme listeners.
  const bootTheme = useMemo<ThemeId>(() => getStoredTheme(), []);
  const [active, setActive] = useState<ThemeId>(bootTheme);

  // Keep our local "active" mirror in sync if another surface changes the
  // theme while this page is open (e.g. someone pops the controller's
  // ThemeMenu). Cheap polling; theme changes are user-triggered and rare.
  useEffect(() => {
    const id = window.setInterval(() => {
      const stored = getStoredTheme();
      setActive((prev) => (prev === stored ? prev : stored));
    }, 750);
    return () => window.clearInterval(id);
  }, []);

  function pick(id: ThemeId) {
    setTheme(id);
    setActive(id);
  }

  function restore() {
    setTheme(bootTheme);
    setActive(bootTheme);
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8 max-w-[1200px] mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            to="/1"
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to deck
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Theme Preview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Click a palette to apply it instantly. Titles, body copy, and
            capsules below all live-update.{' '}
            <span className="text-foreground/80">
              Active:{' '}
              <span className="text-gold font-medium">{THEMES[active].label}</span>
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={restore}
          disabled={active === bootTheme}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background text-[12px] hover:text-gold hover:bg-gold/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Restore boot theme ({THEMES[bootTheme].label})
        </button>
      </header>

      {/* Theme picker grid — every registered theme as a clickable swatch tile. */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold mb-3">
          Palettes ({THEME_IDS.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {THEME_IDS.map((id) => {
            const t = THEMES[id];
            const isActive = id === active;
            return (
              <button
                key={id}
                type="button"
                onClick={() => pick(id)}
                aria-pressed={isActive}
                className={[
                  'group text-left rounded-md border transition p-3',
                  isActive
                    ? 'border-gold/70 bg-gold/10 ring-1 ring-gold/40'
                    : 'border-border bg-surface-1/30 hover:border-foreground/40',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12.5px] font-medium truncate">{t.label}</span>
                  {isActive && <Check className="h-3.5 w-3.5 text-gold shrink-0" />}
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {t.swatch.map((hex, i) => (
                    <span
                      key={i}
                      className="h-6 flex-1 rounded-sm border border-black/30"
                      style={{ background: hex }}
                      aria-hidden
                    />
                  ))}
                </div>
                <p className="text-[10.5px] text-muted-foreground leading-snug line-clamp-2">
                  {t.description}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/70 mt-1.5">
                  {t.id} · {t.appearance ?? 'dark'}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live preview surfaces — wrapped in `.slide-content` so the scoped
          font scaling and weight-shadow tokens kick in exactly as they do
          inside an actual slide. */}
      <section className="space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          Live preview
        </h2>

        {/* Typography card */}
        <div className="slide-content rounded-lg border border-border bg-surface-1/40 p-8">
          <span className="slide-eyebrow block mb-3">Riseup Asia · Showcase</span>
          <h3 className="slide-title-display text-5xl mb-4">
            Designer-grade premium feel.
          </h3>
          <p className="text-foreground/85 text-base max-w-[60ch] leading-relaxed">
            MD ALIM UL KARIM presents a noir, gold-accented presentation system
            built on keyword density, cinematic transitions, and capsule-led
            structure. The presenter narrates; the slides anchor.
          </p>
          <p className="text-muted-foreground text-sm mt-3 max-w-[60ch] leading-relaxed">
            Body text uses Inter (with Apple system fallback). Titles use Ubuntu
            Bold. Both inherit the active theme's weight-shadow tokens for the
            subtle 45° bevel.
          </p>
        </div>

        {/* Capsule card — every variant in one place. */}
        <div className="slide-content rounded-lg border border-border bg-surface-1/40 p-8">
          <span className="slide-eyebrow block mb-4">Capsule labels</span>
          <div className="flex flex-wrap gap-2.5">
            {CAPSULE_VARIANTS.map((variant) => (
              <span
                key={variant}
                className={`capsule capsule-${variant}`}
              >
                {variant}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 font-mono">
            .capsule.capsule-{'{'}variant{'}'} — every chip re-renders against
            the active palette tokens.
          </p>
        </div>

        {/* Surfaces & accents card — visualizes background, surface-1, gold,
            cream, foreground so authors can spot contrast issues fast. */}
        <div className="slide-content rounded-lg border border-border bg-surface-1/40 p-8">
          <span className="slide-eyebrow block mb-4">Surfaces &amp; accents</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SurfaceSwatch label="background" cssVar="--background" textVar="--foreground" />
            <SurfaceSwatch label="surface-1" cssVar="--surface-1" textVar="--foreground" />
            <SurfaceSwatch label="gold" cssVar="--gold" textVar="--background" />
            <SurfaceSwatch label="cream" cssVar="--cream" textVar="--background" />
          </div>
        </div>
      </section>
    </main>
  );
}

/**
 * Solid color tile that pulls its fill straight from the live CSS variable,
 * so it tracks theme switches with zero re-render plumbing.
 */
function SurfaceSwatch({ label, cssVar, textVar }: { label: string; cssVar: string; textVar: string }) {
  return (
    <div
      className="rounded-md border border-border h-20 px-3 py-2 flex flex-col justify-between text-[11px]"
      style={{
        backgroundColor: `hsl(var(${cssVar}))`,
        color: `hsl(var(${textVar}))`,
      }}
    >
      <span className="font-medium">{label}</span>
      <span className="font-mono opacity-70">{cssVar}</span>
    </div>
  );
}
