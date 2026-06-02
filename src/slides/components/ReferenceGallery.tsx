/**
 * ReferenceGallery — one-click in-app preview for every reference image
 * cited by the LLM authoring pack (`spec/slides/llm/assets/`).
 *
 * # Why this exists
 * Authors and AI handoff partners shouldn't have to dig into the repo to
 * find the canonical screenshots — canvas frame, ambient background,
 * typography ladder, JSON-flow diagram, controller pill, step-timeline
 * target/anti-pattern, presenter chip, brand wordmark. The gallery surfaces
 * all of them on `/style-guide`, grouped by topic, with a click-to-zoom
 * lightbox + the same "what to notice" caption from `index.md`.
 *
 * # Asset pipeline
 * Source files live in `spec/slides/llm/assets/{topic}/*.png` (the canonical
 * pack location). They're mirrored to `public/reference/{topic}/` so Vite
 * can serve them at runtime via plain `<img src="/reference/...">` paths
 * — no bundler import per image, no asset-registry round-trip needed for
 * what is essentially a docs surface.
 *
 * # Adding a new reference
 *   1. Author the PNG into `spec/slides/llm/assets/{topic}/foo.png`.
 *   2. Copy it into `public/reference/{topic}/foo.png`.
 *   3. Add a row here AND in `spec/slides/llm/assets/index.md`.
 */
import { useState } from 'react';
import { ImageIcon, Maximize2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ReferenceAsset {
  /** Path under `/public/reference/` — what the `<img>` `src` resolves to. */
  src: string;
  /** Filename for download / canonical-source pointer (no path). */
  filename: string;
  /** Short title shown under the thumbnail. */
  title: string;
  /** Single-line "what to notice" — mirrors the index.md caption verbatim. */
  caption: string;
  /** Playbook files that cite this image, e.g. `02-step-system-complete.md §1`. */
  citedBy: string[];
}

interface ReferenceCategory {
  /** Stable key — used for keyed React lists and as a CSS hook. */
  key: string;
  /** Heading shown above the row. */
  title: string;
  /** Lead-in copy that sets context for the row. */
  blurb: string;
  assets: ReferenceAsset[];
}

/** Single source of truth — must match `spec/slides/llm/assets/index.md`. */
const REFERENCE_CATEGORIES: ReferenceCategory[] = [
  {
    key: 'canvas',
    title: 'Canvas',
    blurb: 'The 1920×1080 frame and its reserved bands. Pin every layout to these guides.',
    assets: [
      {
        src: '/reference/canvas/canvas-1920x1080.png',
        filename: 'canvas-1920x1080.png',
        title: 'Canvas — 1920 × 1080',
        caption:
          'Reserved 96px top/bottom bands; centered safe area 1440×760 split 560 list / 80 gutter / 800 detail.',
        citedBy: ['07-canvas-and-scaling.md', '19-remediation-pack.md §G1.1'],
      },
    ],
  },
  {
    key: 'background',
    title: 'Background',
    blurb: 'Default ambient preset and the sandwich rule that keeps text readable over it.',
    assets: [
      {
        src: '/reference/background/ambient-drift.png',
        filename: 'ambient-drift.png',
        title: 'Ambient drift',
        caption:
          'Soft gold radial glow centered; ember dots + cream wisp; default ambient preset.',
        citedBy: [
          '04-ambient-and-title-background.md Part A',
          '08-background-system.md',
          '19-remediation-pack.md §G1.2',
        ],
      },
    ],
  },
  {
    key: 'typography',
    title: 'Typography',
    blurb: 'The 8-rung type ladder. Authors must snap to a rung — never invent in-between sizes.',
    assets: [
      {
        src: '/reference/typography/scale.png',
        filename: 'scale.png',
        title: 'Typography scale',
        caption:
          '8-rung ladder: Display XL/LG/MD, Title, Body, Eyebrow (gold uppercase), Capsule, Caption.',
        citedBy: ['10-typography.md', '19-remediation-pack.md §G1.3'],
      },
    ],
  },
  {
    key: 'authoring',
    title: 'Authoring',
    blurb: 'How a voice or text intake turns into a finished slide spec.',
    assets: [
      {
        src: '/reference/authoring/json-flow.png',
        filename: 'json-flow.png',
        title: 'JSON authoring flow',
        caption:
          'Voice/text → intake → template → variety guard → 3 atomic artifacts → 40-box checklist.',
        citedBy: [
          '15-authoring-template.md',
          '16-voice-to-slide-protocol.md §7',
          '19-remediation-pack.md §G1.4',
        ],
      },
    ],
  },
  {
    key: 'step',
    title: 'Step timeline',
    blurb: 'The canonical "looks right" reference + the anti-pattern to compare against.',
    assets: [
      {
        src: '/reference/step/target.png',
        filename: 'target.png',
        title: 'Step timeline — target',
        caption:
          'Active row pure white + 1.0 opacity; gold connector pinned at left:18px; detail panel = only description surface.',
        citedBy: ['02-step-system-complete.md §1', '12-steps-pattern.md §1'],
      },
      {
        src: '/reference/step/broken-reference.png',
        filename: 'broken-reference.png',
        title: 'Step timeline — anti-pattern',
        caption:
          'Description rendered under list rows, list column too narrow, connector floats off-axis. "Not this" diff.',
        citedBy: ['12-steps-pattern.md §3'],
      },
    ],
  },
  {
    key: 'title',
    title: 'Title slide',
    blurb: 'Brand wordmark + presenter chip. Never recolor, crop, or re-kern the wordmark.',
    assets: [
      {
        src: '/reference/title/riseup-asia-logo.png',
        filename: 'riseup-asia-logo.png',
        title: 'Riseup Asia wordmark',
        caption: 'Brand wordmark proportions; never recolor, never crop, never re-kern.',
        citedBy: ['04-ambient-and-title-background.md Part B', '09-title-background.md'],
      },
      {
        src: '/reference/title/presenter.png',
        filename: 'presenter.png',
        title: 'Presenter chip — MD ALIM UL KARIM',
        caption: 'Presenter portrait framed circular at title slide bottom-left.',
        citedBy: ['04-ambient-and-title-background.md Part B'],
      },
    ],
  },
  {
    key: 'controller',
    title: 'Controller',
    blurb: 'Bottom-center pill — hidden by default, hover-reveals.',
    assets: [
      {
        src: '/reference/controller/controller-pill.png',
        filename: 'controller-pill.png',
        title: 'Controller pill',
        caption:
          'Order: prev / "N/total" / next / share / fullscreen. Pill at bottom-center; hover-reveals.',
        citedBy: ['00-readme.md commandment 7'],
      },
    ],
  },
];

export function ReferenceGallery() {
  // The lightbox tracks the currently zoomed asset, or null when closed.
  // We render a single shared <Dialog> rather than one per thumbnail so the
  // DOM stays small even as the asset list grows.
  const [zoomed, setZoomed] = useState<ReferenceAsset | null>(null);

  return (
    <section aria-labelledby="reference-gallery-heading" className="space-y-6">
      <header className="space-y-1">
        <p className="slide-eyebrow !text-[0.7rem]">REFERENCE GALLERY</p>
        <h2
          id="reference-gallery-heading"
          className="font-display font-bold text-2xl text-title-cream tracking-tight"
        >
          Canonical screenshots
        </h2>
        <p className="text-xs text-muted-foreground max-w-2xl">
          One-click previews of every image cited by the LLM authoring pack
          (<code className="font-mono text-gold">spec/slides/llm/assets/index.md</code>).
          Click any thumbnail to zoom; the caption mirrors the "what to notice" line in the index.
        </p>
      </header>

      <div className="space-y-10">
        {REFERENCE_CATEGORIES.map((cat) => (
          <div key={cat.key} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                {cat.title}{' '}
                <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {cat.assets.length} image{cat.assets.length === 1 ? '' : 's'}
                </span>
              </h3>
              <p className="text-[11px] text-muted-foreground italic">{cat.blurb}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.assets.map((asset) => (
                <button
                  key={asset.src}
                  type="button"
                  onClick={() => setZoomed(asset)}
                  className="group text-left rounded-lg overflow-hidden border border-border bg-surface-1/30 hover:border-gold/40 transition lift-hover-subtle"
                  aria-label={`Zoom ${asset.title}`}
                >
                  <div className="relative aspect-video bg-surface-2/40 overflow-hidden">
                    <img
                      src={asset.src}
                      alt={asset.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    {/* Hover affordance — corner badge so it's obvious the
                        thumbnail is clickable, not just decorative. */}
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded bg-background/85 backdrop-blur px-1.5 py-0.5 text-[10px] text-gold opacity-0 group-hover:opacity-100 transition">
                      <Maximize2 className="h-3 w-3" /> Zoom
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground leading-tight">
                      {asset.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {asset.caption}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ----- Shared lightbox ----- */}
      <Dialog open={zoomed !== null} onOpenChange={(open) => !open && setZoomed(null)}>
        <DialogContent className="max-w-[min(96vw,1400px)] sm:max-w-[min(96vw,1400px)] p-0 overflow-hidden bg-background border-border">
          {zoomed && (
            <>
              <DialogHeader className="px-5 pt-4 pb-3 border-b border-border space-y-1.5">
                <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ImageIcon className="h-4 w-4 text-gold" />
                  {zoomed.title}
                </DialogTitle>
                <DialogDescription className="text-[12px] text-muted-foreground leading-relaxed">
                  {zoomed.caption}
                </DialogDescription>
              </DialogHeader>
              <div className="bg-surface-2/40 max-h-[75vh] overflow-auto flex items-center justify-center">
                <img
                  src={zoomed.src}
                  alt={zoomed.title}
                  className="max-w-full max-h-[75vh] object-contain"
                />
              </div>
              <div className="px-5 py-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-muted-foreground">
                  <span className="text-foreground/70">Cited by:</span>{' '}
                  {zoomed.citedBy.map((c, i) => (
                    <span key={c}>
                      <code className="font-mono text-gold">{c}</code>
                      {i < zoomed.citedBy.length - 1 ? ' · ' : ''}
                    </span>
                  ))}
                </div>
                <a
                  href={zoomed.src}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-gold transition"
                >
                  <ExternalLink className="h-3 w-3" /> Open full size
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
