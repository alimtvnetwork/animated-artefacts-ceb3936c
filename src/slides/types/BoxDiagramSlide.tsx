import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec, DiagramNodeSpec, DiagramEdgeSpec, DiagramFieldSpec } from '../types';
import { titleClassFor } from '../preset';

/**
 * BoxDiagramSlide (v0.169) — generic boxes-with-fields diagram.
 *
 * Inspired by the external "ER box" recipe but generalised: any topic that
 * fits "rectangles connected by lines" can use this — ER diagrams,
 * architecture diagrams, state machines, dependency graphs.
 *
 * Authors place nodes by % position on a 1600×900 SVG canvas (so coords
 * read like a 16:9 layout rather than pixels). Edges connect nodes by id;
 * each endpoint's cardinality renders either a single perpendicular tick
 * (`'1'`) or a 3-line crow's foot (`'N'`).
 *
 * Layout: 4/8 split when `diagramExplanation` is set (short prose left,
 * diagram right); diagram-only otherwise.
 */
const NODE_HEADER_H = 56;
const NODE_ROW_H = 38;
const CANVAS_W = 1600;
const CANVAS_H = 900;

function fieldColor(role?: DiagramFieldSpec['role']): string {
  if (role === 'pk') return 'hsl(var(--gold))';
  if (role === 'fk') return 'hsl(var(--ember))';
  return 'hsl(var(--foreground))';
}

interface NodeBox {
  node: DiagramNodeSpec;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

function layoutNodes(nodes: DiagramNodeSpec[]): NodeBox[] {
  return nodes.map((n) => {
    const w = ((n.w ?? 22) / 100) * CANVAS_W;
    const h = NODE_HEADER_H + (n.fields?.length ?? 0) * NODE_ROW_H;
    const x = (n.x / 100) * CANVAS_W;
    const y = (n.y / 100) * CANVAS_H;
    return { node: n, x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  });
}

/** Compute connector endpoint on the box edge nearest to the other box. */
function edgePoint(from: NodeBox, to: NodeBox): { x: number; y: number; side: 'l' | 'r' | 't' | 'b' } {
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  const horiz = Math.abs(dx) > Math.abs(dy);
  if (horiz) {
    return dx > 0
      ? { x: from.x + from.w, y: from.cy, side: 'r' }
      : { x: from.x,         y: from.cy, side: 'l' };
  }
  return dy > 0
    ? { x: from.cx, y: from.y + from.h, side: 'b' }
    : { x: from.cx, y: from.y,          side: 't' };
}

/** Render a cardinality glyph at one endpoint of the connector. */
function CardinalityGlyph({ x, y, side, kind, color }: { x: number; y: number; side: 'l' | 'r' | 't' | 'b'; kind: '1' | 'N'; color: string }) {
  const inward = side === 'l' ? 1 : side === 'r' ? -1 : 0;
  const inwardY = side === 't' ? 1 : side === 'b' ? -1 : 0;
  const len = 14;
  if (kind === '1') {
    // Single perpendicular tick.
    if (side === 'l' || side === 'r') {
      return <line x1={x + inward * len} y1={y - 10} x2={x + inward * len} y2={y + 10} stroke={color} strokeWidth={2.5} />;
    }
    return <line x1={x - 10} y1={y + inwardY * len} x2={x + 10} y2={y + inwardY * len} stroke={color} strokeWidth={2.5} />;
  }
  // Crow's foot — 3 short lines fanning to the box edge.
  if (side === 'l' || side === 'r') {
    return (
      <g stroke={color} strokeWidth={2.5} fill="none">
        <line x1={x + inward * len} y1={y - 12} x2={x} y2={y} />
        <line x1={x + inward * len} y1={y     } x2={x} y2={y} />
        <line x1={x + inward * len} y1={y + 12} x2={x} y2={y} />
      </g>
    );
  }
  return (
    <g stroke={color} strokeWidth={2.5} fill="none">
      <line x1={x - 12} y1={y + inwardY * len} x2={x} y2={y} />
      <line x1={x     } y1={y + inwardY * len} x2={x} y2={y} />
      <line x1={x + 12} y1={y + inwardY * len} x2={x} y2={y} />
    </g>
  );
}

function ERBoxNode({ box }: { box: NodeBox }) {
  const fields = box.node.fields ?? [];
  return (
    <g>
      {/* Surface */}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={14} fill="hsl(var(--surface-1))" stroke="hsl(var(--border))" strokeWidth={1.5} />
      {/* Header bar */}
      <rect x={box.x} y={box.y} width={box.w} height={NODE_HEADER_H} rx={14} fill="hsl(var(--surface-3))" />
      {/* mask the bottom corners of the header so it sits flush with the rows */}
      <rect x={box.x} y={box.y + NODE_HEADER_H - 14} width={box.w} height={14} fill="hsl(var(--surface-3))" />
      <text
        x={box.x + 18}
        y={box.y + NODE_HEADER_H / 2 + 6}
        fill="hsl(var(--cream))"
        fontFamily="Ubuntu, Inter, sans-serif"
        fontWeight={700}
        fontSize={20}
      >
        {box.node.title}
      </text>
      {/* Field rows */}
      {fields.map((f, i) => {
        const ry = box.y + NODE_HEADER_H + i * NODE_ROW_H;
        return (
          <g key={`${f.name}-${i}`}>
            {i % 2 === 1 && (
              <rect x={box.x + 1} y={ry} width={box.w - 2} height={NODE_ROW_H} fill="hsl(var(--surface-2) / 0.55)" />
            )}
            <text
              x={box.x + 18}
              y={ry + NODE_ROW_H / 2 + 5}
              fill={fieldColor(f.role)}
              fontFamily='"JetBrains Mono", ui-monospace, monospace'
              fontSize={15}
            >
              {f.role === 'pk' ? '🔑 ' : f.role === 'fk' ? '🔗 ' : ''}
              {f.name}
            </text>
            {f.type && (
              <text
                x={box.x + box.w - 18}
                y={ry + NODE_ROW_H / 2 + 5}
                textAnchor="end"
                fill="hsl(var(--muted-foreground))"
                fontFamily='"JetBrains Mono", ui-monospace, monospace'
                fontSize={13}
              >
                {f.type}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

export function BoxDiagramSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const nodes: DiagramNodeSpec[] = c.diagramNodes ?? [];
  const edges: DiagramEdgeSpec[] = c.diagramEdges ?? [];
  const hasExplanation = Boolean(c.diagramExplanation);

  const boxes = layoutNodes(nodes);
  const byId = new Map(boxes.map((b) => [b.node.id, b]));

  return (
    <section
      role="region"
      aria-label={`Diagram: ${c.title ?? spec.slideName}`}
      className="relative h-full w-full overflow-hidden flex flex-col px-24 py-20"
    >
      <motion.header
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        {c.eyebrow && <p className="slide-eyebrow mb-3">{c.eyebrow}</p>}
        {c.title && <h2 className={`slide-title-content ${titleClassFor(spec)}`}>{c.title}</h2>}
        {c.subtitle && <p className="slide-subtitle mt-2">{c.subtitle}</p>}
      </motion.header>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className={`flex-1 min-h-0 ${hasExplanation ? 'slide-grid-4-8' : ''}`}
      >
        {hasExplanation && (
          <div className="slide-card flex flex-col justify-center">
            <p className="text-base leading-relaxed text-foreground/90">{c.diagramExplanation}</p>
          </div>
        )}
        <div className="w-full h-full flex items-center justify-center">
          <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full max-h-[700px]">
            {edges.map((e, i) => {
              const a = byId.get(e.from);
              const b = byId.get(e.to);
              if (!a || !b) return null;
              const pa = edgePoint(a, b);
              const pb = edgePoint(b, a);
              const [ca, cb] = e.cardinality ?? ['1', 'N'];
              const midX = (pa.x + pb.x) / 2;
              const midY = (pa.y + pb.y) / 2;
              return (
                <g key={`e-${i}`}>
                  <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="hsl(var(--gold))" strokeWidth={2.5} fill="none" />
                  <CardinalityGlyph x={pa.x} y={pa.y} side={pa.side} kind={ca} color="hsl(var(--gold))" />
                  <CardinalityGlyph x={pb.x} y={pb.y} side={pb.side} kind={cb} color="hsl(var(--gold))" />
                  {e.label && (
                    <text x={midX} y={midY - 8} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontFamily="Inter, sans-serif" fontSize={14} fontStyle="italic">
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}
            {boxes.map((b) => <ERBoxNode key={b.node.id} box={b} />)}
          </svg>
        </div>
      </motion.div>
    </section>
  );
}
