/**
 * /style-guide — single-page, in-app design reference.
 *
 * # What this page is for
 * A working cheat-sheet for anyone authoring slides in this deck. Every
 * preset token is shown verbatim (so authors can copy-paste), and every
 * slide type is rendered as a live thumbnail using the same `SlidePreview`
 * the GridOverview uses. The thumbnails are NOT mockups — they're the
 * actual components running with their schema defaults, so the page also
 * doubles as a smoke test: if a slide type is broken, its tile is broken.
 *
 * # Sections (top → bottom)
 *   1. Header  — purpose + how to reuse
 *   2. Tokens  — the 4 CSS classes + the 4 title color classes + shimmer
 *   3. Color resolution — the precedence rules (per-slide → preset → fallback)
 *   4. Capsule colors — the 5 capsule fills with usage notes
 *   5. Slide thumbnails — every SlideTypeValue rendered live
 *
 * # Why this lives in /pages and not /docs
 * Authors need to see what the tokens *currently* produce in this build,
 * not what they used to produce when the doc was written. Rendering live
 * is the only way to keep the guide honest.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Wand2 } from 'lucide-react';
import { SlidePreview } from '../slides/components/SlidePreview';
import { SLIDE_TYPE_KEYS, SLIDE_TYPE_SCHEMAS } from '../builder/fieldSchemas';
import { makeSlide } from '../builder/draftDeck';
import { Capsule } from '../slides/components/Capsule';
import { ReferenceGallery } from '../slides/components/ReferenceGallery';

/* ------------------------------------------------------------------ */
/* Token tables (single source of truth — keep in sync with index.css) */
/* ------------------------------------------------------------------ */

interface TokenRow {
  cls: string;
  use: string;
  spec: string;
}

const TYPOGRAPHY_TOKENS: TokenRow[] = [
  {
    cls: '.slide-title-display',
    use: 'Hero / TitleSlide / SectionDividerSlide',
    spec: 'Ubuntu 700 · -0.02em · lh 0.95 · clamp(2.5rem, 6vw, 6rem)',
  },
  {
    cls: '.slide-title-content',
    use: 'Body slides (CapsuleList, StepTimeline, QrMeeting, …)',
    spec: 'Ubuntu 700 · -0.02em · lh 1.05 · clamp(2rem, 4.2vw, 3.75rem)',
  },
  {
    cls: '.slide-eyebrow',
    use: 'Above every title',
    spec: 'Inter 700 · 0.75rem fixed · 0.35em tracking · uppercase · gold',
  },
  {
    cls: '.slide-subtitle',
    use: 'Under every title',
    spec: 'Inter 400 · clamp(1rem, 1.6vw, 1.5rem) · --foreground/70 · lh 1.5',
  },
];

const TITLE_COLOR_TOKENS: TokenRow[] = [
  { cls: '.text-title-white',  use: 'Hero auto-pick (TitleSlide, SectionDividerSlide)', spec: 'color: hsl(var(--white))' },
  { cls: '.text-title-cream',  use: 'Default body title under premium preset',          spec: 'color: hsl(var(--cream))' },
  { cls: '.text-title-gold',   use: 'Brand emphasis — paired with titleShimmer',        spec: 'color: hsl(var(--gold-glow))' },
  { cls: '.text-gold-gradient',use: 'Legacy / decorative only — prefer solid gold',     spec: 'background: var(--gradient-text-gold) → -webkit-background-clip: text' },
  { cls: '.shimmer-sweep',     use: 'One-shot highlight across a solid title',          spec: 'Wrap on the title element. Pairs with titleShimmer flag.' },
];

const CAPSULE_TOKENS: { color: 'gold' | 'ember' | 'cream' | 'ink' | 'outline'; use: string }[] = [
  { color: 'gold',    use: 'Primary CTA / hero offering' },
  { color: 'ember',   use: 'Accent / urgency' },
  { color: 'cream',   use: 'Neutral / supporting label' },
  { color: 'ink',     use: 'Quiet item on a brand background' },
  { color: 'outline', use: 'Tertiary / decorative grouping' },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function StyleGuidePage() {
  // Build one preview slide per type, seeded from the same defaults the
  // builder uses so the thumbnails match what authors see when they pick a
  // type for the first time. Memoised — the SlidePreview re-renders the
  // actual slide component, which is heavy on first paint.
  const sampleSlides = useMemo(
    () => SLIDE_TYPE_KEYS.map((type, idx) => ({
      type,
      slide: makeSlide(type, idx + 1, 'premium'),
    })),
    [],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 h-14 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/1" className="lift-hover-subtle inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Back to deck
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <h1 className="text-sm font-medium tracking-wide">Style guide</h1>
          </div>
          <Link
            to="/builder"
            className="lift-hover-subtle inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5"
          >
            <Wand2 className="h-3.5 w-3.5" /> Open builder
          </Link>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-10 space-y-14">
        {/* ---------- Intro ---------- */}
        <section className="space-y-3 max-w-2xl">
          <p className="slide-eyebrow !text-[0.7rem]">PREMIUM PRESET — DECK CHEAT SHEET</p>
          <h2 className="font-display font-bold text-4xl text-title-cream tracking-tight leading-tight">
            One preset, every slide.
          </h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Every deck inherits the <code className="px-1.5 py-0.5 rounded bg-surface-2/60 text-gold font-mono text-[12px]">premium</code> preset
            by default. That preset locks Ubuntu Bold typography, clamp-based sizing, and a small set of
            title color rules. Reuse the tokens below in any new slide component — never hard-code
            sizes or hex values.
          </p>
        </section>

        {/* ---------- Typography tokens ---------- */}
        <TokenSection
          title="Typography scale"
          subtitle="Four CSS classes — pair with a title color class. Defined in `src/index.css`."
          rows={TYPOGRAPHY_TOKENS}
          examples={
            <div className="space-y-4 p-6 rounded-xl border border-border bg-surface-1/40">
              <p className="slide-eyebrow">EYEBROW EXAMPLE</p>
              <p className="slide-title-display text-title-cream">Display title</p>
              <p className="slide-title-content text-title-cream">Content title</p>
              <p className="slide-subtitle">A subtitle reads at 70% foreground with comfortable leading.</p>
            </div>
          }
        />

        {/* ---------- Title color tokens ---------- */}
        <TokenSection
          title="Title color tokens"
          subtitle="Compose with a typography class. Resolution rules below decide which one a slide gets."
          rows={TITLE_COLOR_TOKENS}
          examples={
            <div className="space-y-3 p-6 rounded-xl border border-border bg-surface-1/40">
              <p className="slide-title-content text-title-white">.text-title-white</p>
              <p className="slide-title-content text-title-cream">.text-title-cream</p>
              <p className="slide-title-content text-title-gold">.text-title-gold</p>
              <p className="slide-title-content text-gold-gradient">.text-gold-gradient</p>
            </div>
          }
        />

        {/* ---------- Color resolution rules ---------- */}
        <section className="space-y-4">
          <SectionHeader title="Color resolution" subtitle="resolveTitleStyle(slide) — most → least specific" />
          <ol className="space-y-2 text-sm text-foreground/85 max-w-2xl">
            <li className="flex gap-3">
              <span className="text-gold font-mono text-xs pt-0.5">01</span>
              <span><b>Per-slide <code className="font-mono text-xs px-1 rounded bg-surface-2/60">titleStyle</code></b> always wins. Use only for one-off overrides.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold font-mono text-xs pt-0.5">02</span>
              <span><b>Preset auto-pick</b> (premium):
                <code className="ml-1 font-mono text-xs px-1 rounded bg-surface-2/60">TitleSlide / SectionDividerSlide → white</code> ·
                <code className="ml-1 font-mono text-xs px-1 rounded bg-surface-2/60">titleShimmer:true → gold</code> ·
                <code className="ml-1 font-mono text-xs px-1 rounded bg-surface-2/60">else → cream</code>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold font-mono text-xs pt-0.5">03</span>
              <span><b>Cream fallback</b> — only reached if a future preset is added that doesn't auto-pick.</span>
            </li>
          </ol>
          <pre className="text-[12px] leading-relaxed bg-surface-1/40 border border-border rounded-xl p-4 overflow-auto text-foreground/90 font-mono max-w-2xl">
{`<h2 className={\`slide-title-display \${titleClassFor(spec)}\`}>
  {c.title}
</h2>`}
          </pre>
        </section>

        {/* ---------- Capsule colors ---------- */}
        <section className="space-y-4">
          <SectionHeader title="Capsule colors" subtitle="Vibrant by default — gold and ember read as confident buttons, not muted tags." />
          <div className="flex flex-wrap gap-3 p-6 rounded-xl border border-border bg-surface-1/40">
            {CAPSULE_TOKENS.map(c => (
              <div key={c.color} className="flex flex-col items-center gap-2">
                <Capsule spec={{ text: c.color, color: c.color }} />
                <span className="text-[11px] text-muted-foreground max-w-[140px] text-center leading-tight">{c.use}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Live slide thumbnails ---------- */}
        <section className="space-y-4">
          <SectionHeader
            title="Slide types"
            subtitle="Live thumbnails — exactly what you get when picking a type in the builder."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sampleSlides.map(({ type, slide }) => {
              const schema = SLIDE_TYPE_SCHEMAS[type];
              return (
                <article key={type} className="space-y-2 group">
                  <div className="rounded-lg overflow-hidden border border-border bg-surface-1/30 transition-colors group-hover:border-gold/40">
                    <SlidePreview slide={slide} width={420} />
                  </div>
                  <div className="px-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{schema.label}</h3>
                      <code className="font-mono text-[10px] text-muted-foreground">{type}</code>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{schema.blurb}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ---------- Reference gallery (v0.135) ----------
            Mirrors every screenshot from `spec/slides/llm/assets/` into a
            click-to-zoom gallery so authors don't need to dig through the
            repo for canvas / background / typography / authoring + the
            existing step / title / controller references. Source of truth
            for paths + captions: `index.md` next to those PNGs. */}
        <ReferenceGallery />
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="space-y-1">
      <p className="slide-eyebrow !text-[0.7rem]">{title.toUpperCase()}</p>
      <h2 className="font-display font-bold text-2xl text-title-cream tracking-tight">{title}</h2>
      <p className="text-xs text-muted-foreground max-w-2xl">{subtitle}</p>
    </header>
  );
}

function TokenSection({
  title,
  subtitle,
  rows,
  examples,
}: {
  title: string;
  subtitle: string;
  rows: TokenRow[];
  examples: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="grid lg:grid-cols-[1fr_minmax(0,420px)] gap-6">
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2/40 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Class</th>
                <th className="px-4 py-2.5 font-semibold">Use on</th>
                <th className="px-4 py-2.5 font-semibold">Spec</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.cls} className="border-t border-border/60">
                  <td className="px-4 py-2.5 font-mono text-gold whitespace-nowrap">{r.cls}</td>
                  <td className="px-4 py-2.5 text-foreground/80">{r.use}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.spec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {examples}
      </div>
    </section>
  );
}
