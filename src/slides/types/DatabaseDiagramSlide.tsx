import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useId, useRef, useState } from 'react';
import type { SlideSpec } from '../types';
import { titleClassFor } from '../preset';

/**
 * DatabaseDiagramSlide — addendum 29 §2.1.
 *
 * Two render modes, picked per-slide:
 *
 * 1. **Mermaid mode** (preferred) — author supplies `content.diagram`
 *    as a Mermaid `erDiagram` source. We dynamic-import `mermaid`,
 *    initialise it with CSS-token-driven theme variables, and render
 *    once on mount. No auto-pan / auto-zoom (reduced-motion contract).
 *
 * 2. **Inline-SVG fallback** — author supplies `dbEntities` + optional
 *    `dbRelationships`. Boxes auto-layout on a circle when no `x/y`
 *    given.
 *
 * Caps (enforced in `densityCheck.ts`): ≤5 entities, ≤6 relationships.
 */
interface Entity { id: string; name: string; x: number; y: number; fields?: string[] }
interface Rel { from: string; to: string; label?: string }

function defaultLayout(entities: { id: string; name: string; fields?: string[] }[]): Entity[] {
  const cx = 50, cy = 50, r = 32;
  const n = entities.length;
  return entities.map((e, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { ...e, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });
}

/** CSS-token theme passed to mermaid.initialize — never raw hex. */
const mermaidThemeVariables = {
  primaryColor:        'hsl(var(--surface-2, var(--background)))',
  primaryTextColor:    'hsl(var(--cream))',
  primaryBorderColor:  'hsl(var(--gold))',
  lineColor:           'hsl(var(--gold) / 0.6)',
  secondaryColor:      'hsl(var(--surface-1, var(--background)))',
  tertiaryColor:       'hsl(var(--ember) / 0.18)',
  fontFamily:          'Inter, system-ui, sans-serif',
  textColor:           'hsl(var(--foreground))',
} as const;

function MermaidErd({ source }: { source: string }) {
  const reactId = useId().replace(/[:]/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: mermaidThemeVariables,
          er: { useMaxWidth: true },
        });
        const renderId = `erd-${reactId}`;
        const { svg } = await mermaid.render(renderId, source);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Mermaid render failed');
      }
    })();
    return () => { cancelled = true; };
  }, [source, reactId]);

  if (error) {
    return (
      <div role="alert" className="text-[hsl(var(--ember))] text-sm font-mono p-4 whitespace-pre-wrap">
        {error}
      </div>
    );
  }
  return <div ref={ref} className="mermaid-erd-host w-full h-full flex items-center justify-center [&_svg]:max-h-full [&_svg]:max-w-full" />;
}

function InlineErd({ entities, rels }: { entities: Entity[]; rels: Rel[] }) {
  const lookup = new Map(entities.map((e) => [e.id, e]));
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {rels.map((r, i) => {
        const a = lookup.get(r.from);
        const b = lookup.get(r.to);
        if (!a || !b) return null;
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--gold) / 0.6)" strokeWidth="0.4" />
            {r.label && (
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 1} textAnchor="middle" fontSize="2" fill="hsl(var(--cream) / 0.8)">
                {r.label}
              </text>
            )}
          </g>
        );
      })}
      {entities.map((e) => {
        const w = 22, h = 6 + (e.fields?.length ?? 0) * 3;
        const x = e.x - w / 2, y = e.y - h / 2;
        return (
          <g key={e.id}>
            <rect x={x} y={y} width={w} height={h} rx="1.5" fill="hsl(var(--surface-2, var(--background)))" stroke="hsl(var(--gold))" strokeWidth="0.3" />
            <text x={e.x} y={y + 4} textAnchor="middle" fontSize="2.4" fontWeight="700" fill="hsl(var(--cream))">{e.name}</text>
            {e.fields?.map((f, i) => (
              <text key={f} x={x + 1.5} y={y + 7 + i * 3} fontSize="1.8" fill="hsl(var(--foreground) / 0.8)">{f}</text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function DatabaseDiagramSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const rawEntities = c.dbEntities ?? [];
  const useMermaid = typeof c.diagram === 'string' && c.diagram.length > 0;
  const entities: Entity[] = useMermaid ? [] :
    rawEntities.every((e) => typeof e.x === 'number' && typeof e.y === 'number')
      ? rawEntities as Entity[]
      : defaultLayout(rawEntities);

  return (
    <div
      role="region"
      aria-label={`Database diagram: ${c.title ?? spec.slideName}`}
      className="relative h-full w-full overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div className="absolute inset-0 flex flex-col pt-32 pb-20 px-[var(--brand-inset-x,clamp(48px,15vw,288px))]">
        {c.eyebrow && <span className="slide-eyebrow mb-3">{c.eyebrow}</span>}
        {c.title && <h2 className={`slide-title-content ${titleClassFor(spec)} mb-8`}>{c.title}</h2>}

        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex-1 relative"
        >
          {useMermaid
            ? <MermaidErd source={c.diagram as string} />
            : <InlineErd entities={entities} rels={c.dbRelationships ?? []} />}
        </motion.div>

        {c.subtitle && <p className="slide-subtitle mt-6 text-center max-w-[60ch] mx-auto">{c.subtitle}</p>}
      </div>
    </div>
  );
}
