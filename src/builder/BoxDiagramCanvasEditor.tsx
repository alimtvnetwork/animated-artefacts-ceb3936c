/**
 * Visual editor for `BoxDiagramSlide` / `ERDiagramSlide` content.
 *
 * # Why this exists
 * `diagramNodes`, `diagramEdges`, `entities`, `relationships` are arrays of
 * coordinate-bearing objects (`{x, y, w, fields[]}`) that the runtime
 * happily renders — but ContentFieldEditor previously had no UI for them,
 * which meant authoring was JSON-only. Designers were hand-typing percentages
 * to position boxes. This editor closes that gap with a familiar
 * drag-rectangles-on-canvas surface (mirroring `HotspotCanvasEditor`'s mental
 * model so the rest of the builder feels consistent).
 *
 * # Interactions
 *   - **Move** — drag a node body to reposition (x, y in % of stage).
 *   - **Resize** — drag the right-edge handle to change `w` (12–60% clamp).
 *   - **Connect** — toggle the Connect tool, click source node, then target
 *     node → emits a new edge `{from, to, cardinality: ['1','N']}`. Esc cancels.
 *   - **Select** — click a node or an edge to surface its side-panel form.
 *     Click empty canvas (or Esc) to deselect.
 *   - **Delete / Backspace** while selected removes the node (and all edges
 *     touching it) or the edge.
 *   - **Add node** button creates a new `Untitled` node at a free corner.
 *
 * # Data contract
 * Same shape as the runtime renderer (`src/slides/types/BoxDiagramSlide.tsx`):
 *   - `x`, `y`, `w` are %-of-canvas (0–100); height auto-derives from `fields`.
 *   - Node `id` is stable across edits; edge endpoints reference it.
 *   - Edge cardinality is `['1'|'N', '1'|'N']`, default `['1','N']`.
 *
 * # Why one editor for both BoxDiagram + ER
 * `ERDiagramSlide` uses `entities`/`relationships` as preferred field names
 * but accepts the legacy `diagramNodes`/`diagramEdges` shapes (see
 * `SlideContent` in `src/slides/types.ts`). This component is shape-agnostic —
 * the caller picks which field pair to bind it to and the editor doesn't
 * care about the names.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, MousePointer2, Link2, X, MoveRight } from 'lucide-react';
import type { DiagramNodeSpec, DiagramEdgeSpec, DiagramFieldSpec } from '../slides/types';
import { Field, SelectField, TextField } from './FormPrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  /** Node array (diagramNodes for BoxDiagram, entities for ER). */
  nodes: DiagramNodeSpec[];
  /** Edge array (diagramEdges for BoxDiagram, relationships for ER). */
  edges: DiagramEdgeSpec[];
  /** Emits both arrays atomically so the editor can keep them in sync (e.g. cascade-delete edges when a node is removed). */
  onChange: (next: { nodes: DiagramNodeSpec[]; edges: DiagramEdgeSpec[] }) => void;
  /** Canvas width in CSS px. Height is auto-derived (16:9). */
  canvasWidth?: number;
  /** Display label distinguishing BoxDiagram ("nodes") from ER ("entities"). */
  nodeNoun?: string;
  /** Display label distinguishing BoxDiagram ("edges") from ER ("relationships"). */
  edgeNoun?: string;
}

// Stage matches the runtime canvas (`src/slides/types/BoxDiagramSlide.tsx`).
const STAGE_W = 1600;
const STAGE_H = 900;
const NODE_HEADER_H = 56;
const NODE_ROW_H = 38;
const MIN_W_PCT = 12;
const MAX_W_PCT = 60;

type DragMode =
  | { kind: 'idle' }
  | { kind: 'move'; nodeId: string; offsetXPct: number; offsetYPct: number }
  | { kind: 'resize'; nodeId: string; startW: number; anchorXPct: number };

type Selection =
  | { kind: 'none' }
  | { kind: 'node'; id: string }
  | { kind: 'edge'; index: number };

type ConnectState = { active: boolean; sourceId?: string };

const ROLE_OPTS = [
  { value: 'plain', label: 'Plain' },
  { value: 'pk',    label: 'Primary key (PK)' },
  { value: 'fk',    label: 'Foreign key (FK)' },
] as const;

const CARDINALITY_OPTS = [
  { value: '1', label: '1' },
  { value: 'N', label: 'N (many)' },
] as const;

export function BoxDiagramCanvasEditor({
  nodes,
  edges,
  onChange,
  canvasWidth = 720,
  nodeNoun = 'Node',
  edgeNoun = 'Edge',
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragMode>({ kind: 'idle' });
  const [selection, setSelection] = useState<Selection>({ kind: 'none' });
  const [connect, setConnect] = useState<ConnectState>({ active: false });

  const canvasHeight = canvasWidth * (STAGE_H / STAGE_W);

  /** Project a clientX/clientY pair to the [0, 100] % space of the canvas. */
  const toPct = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
  }, []);

  /** Compute the rendered box dims (in % of stage) for a single node so the canvas
   *  and the hit-tests stay in lockstep with the runtime renderer's geometry. */
  const boxOf = useCallback((n: DiagramNodeSpec) => {
    const w = n.w ?? 22;
    // Height as % of stage (NODE_HEADER + rows × NODE_ROW) projected onto STAGE_H.
    const hPx = NODE_HEADER_H + (n.fields?.length ?? 0) * NODE_ROW_H;
    const h = (hPx / STAGE_H) * 100;
    return { x: n.x, y: n.y, w, h };
  }, []);

  /* ----------------------------------------------------------------------- */
  /* Mutations                                                               */
  /* ----------------------------------------------------------------------- */

  const updateNode = useCallback((id: string, patch: Partial<DiagramNodeSpec>) => {
    onChange({
      nodes: nodes.map(n => (n.id === id ? { ...n, ...patch } : n)),
      edges,
    });
  }, [nodes, edges, onChange]);

  const updateEdge = useCallback((index: number, patch: Partial<DiagramEdgeSpec>) => {
    onChange({
      nodes,
      edges: edges.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    });
  }, [nodes, edges, onChange]);

  /** Remove a node + every edge that touches it (cascade). Selection clears. */
  const deleteNode = useCallback((id: string) => {
    onChange({
      nodes: nodes.filter(n => n.id !== id),
      edges: edges.filter(e => e.from !== id && e.to !== id),
    });
    setSelection({ kind: 'none' });
  }, [nodes, edges, onChange]);

  const deleteEdge = useCallback((index: number) => {
    onChange({ nodes, edges: edges.filter((_, i) => i !== index) });
    setSelection({ kind: 'none' });
  }, [nodes, edges, onChange]);

  const addNode = useCallback(() => {
    const id = freshNodeId(nodes);
    // Drop the new node near the top-left, offset slightly per existing node so
    // multiple "Add node" clicks don't stack on top of each other.
    const offset = Math.min(nodes.length * 6, 60);
    const next: DiagramNodeSpec = {
      id,
      title: 'Untitled',
      x: 6 + offset,
      y: 12 + (offset % 24),
      w: 22,
      fields: [{ name: 'id', type: 'uuid', role: 'pk' }],
    };
    onChange({ nodes: [...nodes, next], edges });
    setSelection({ kind: 'node', id });
  }, [nodes, edges, onChange]);

  const addEdge = useCallback((from: string, to: string) => {
    if (from === to) return;
    if (edges.some(e => e.from === from && e.to === to)) return;
    onChange({
      nodes,
      edges: [...edges, { from, to, cardinality: ['1', 'N'] }],
    });
    setSelection({ kind: 'edge', index: edges.length });
  }, [nodes, edges, onChange]);

  /* ----------------------------------------------------------------------- */
  /* Drag handlers                                                           */
  /* ----------------------------------------------------------------------- */

  const onPointerDownNode = (e: React.PointerEvent, n: DiagramNodeSpec) => {
    e.stopPropagation();
    if (connect.active) {
      if (!connect.sourceId) {
        setConnect({ active: true, sourceId: n.id });
      } else {
        addEdge(connect.sourceId, n.id);
        setConnect({ active: false });
      }
      return;
    }
    setSelection({ kind: 'node', id: n.id });
    const { x, y } = toPct(e.clientX, e.clientY);
    setDrag({ kind: 'move', nodeId: n.id, offsetXPct: x - n.x, offsetYPct: y - n.y });
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerDownResize = (e: React.PointerEvent, n: DiagramNodeSpec) => {
    e.stopPropagation();
    setSelection({ kind: 'node', id: n.id });
    const { x } = toPct(e.clientX, e.clientY);
    setDrag({ kind: 'resize', nodeId: n.id, startW: n.w ?? 22, anchorXPct: x });
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.kind === 'idle') return;
    const { x, y } = toPct(e.clientX, e.clientY);
    if (drag.kind === 'move') {
      const node = nodes.find(n => n.id === drag.nodeId);
      if (!node) return;
      const box = boxOf(node);
      // Clamp so the node stays fully inside the canvas.
      const newX = clamp(x - drag.offsetXPct, 0, 100 - box.w);
      const newY = clamp(y - drag.offsetYPct, 0, 100 - box.h);
      updateNode(drag.nodeId, { x: round1(newX), y: round1(newY) });
    } else if (drag.kind === 'resize') {
      const delta = x - drag.anchorXPct;
      const node = nodes.find(n => n.id === drag.nodeId);
      if (!node) return;
      const maxW = Math.min(MAX_W_PCT, 100 - node.x);
      const newW = clamp(drag.startW + delta, MIN_W_PCT, maxW);
      updateNode(drag.nodeId, { w: round1(newW) });
    }
  };

  const onPointerUp = () => {
    if (drag.kind !== 'idle') setDrag({ kind: 'idle' });
  };

  const onCanvasClick = () => {
    if (connect.active) {
      // Clicking empty canvas while connecting cancels the in-flight edge.
      setConnect({ active: false });
      return;
    }
    setSelection({ kind: 'none' });
  };

  /* ----------------------------------------------------------------------- */
  /* Keyboard                                                                */
  /* ----------------------------------------------------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnect({ active: false });
        setSelection({ kind: 'none' });
        return;
      }
      // Ignore deletions while typing in a form input — a designer renaming
      // a field shouldn't blow away the surrounding node.
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.kind === 'node') deleteNode(selection.id);
        else if (selection.kind === 'edge') deleteEdge(selection.index);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selection, deleteNode, deleteEdge]);

  /* ----------------------------------------------------------------------- */
  /* Edge midpoints (for the click-to-select hit areas + label rendering)    */
  /* ----------------------------------------------------------------------- */

  const edgeGeometry = useMemo(() => {
    return edges.map((edge, i) => {
      const from = nodes.find(n => n.id === edge.from);
      const to = nodes.find(n => n.id === edge.to);
      if (!from || !to) return null;
      const a = boxOf(from);
      const b = boxOf(to);
      const ax = a.x + a.w / 2;
      const ay = a.y + a.h / 2;
      const bx = b.x + b.w / 2;
      const by = b.y + b.h / 2;
      return { index: i, edge, ax, ay, bx, by };
    }).filter((e): e is NonNullable<typeof e> => e !== null);
  }, [edges, nodes, boxOf]);

  const selectedNode = selection.kind === 'node' ? nodes.find(n => n.id === selection.id) : undefined;
  const selectedEdge = selection.kind === 'edge' ? edges[selection.index] : undefined;

  /* ----------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ----------------------------------------------------------------------- */

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addNode}
          className="gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Add {nodeNoun.toLowerCase()}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={connect.active ? 'default' : 'outline'}
          onClick={() => {
            setConnect(c => ({ active: !c.active }));
            setSelection({ kind: 'none' });
          }}
          className="gap-1"
          aria-pressed={connect.active}
        >
          {connect.active ? <X className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          {connect.active
            ? (connect.sourceId ? `Click target ${nodeNoun.toLowerCase()}…` : `Click source ${nodeNoun.toLowerCase()}…`)
            : `Connect (${edgeNoun.toLowerCase()})`}
        </Button>
        <span className="ml-auto text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <MousePointer2 className="h-3.5 w-3.5" />
          drag to move · right-edge to resize · Del to remove
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onClick={onCanvasClick}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative rounded-md border border-border bg-surface-1/40 overflow-hidden select-none"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        {/* Background grid — purely cosmetic, helps the designer see proportions. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: `${canvasWidth / 16}px ${canvasHeight / 9}px`,
          }}
        />

        {/* Edges (SVG layer) */}
        <svg
          className="absolute inset-0 pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {edgeGeometry.map(({ index, edge, ax, ay, bx, by }) => {
            const isSelected = selection.kind === 'edge' && selection.index === index;
            return (
              <g key={index}>
                <line
                  x1={ax} y1={ay} x2={bx} y2={by}
                  stroke={isSelected ? 'hsl(var(--gold))' : 'hsl(var(--foreground))'}
                  strokeOpacity={isSelected ? 0.95 : 0.55}
                  strokeWidth={isSelected ? 0.6 : 0.4}
                  vectorEffect="non-scaling-stroke"
                />
                {edge.label && (
                  <text
                    x={(ax + bx) / 2}
                    y={(ay + by) / 2 - 1}
                    fontSize={2.2}
                    textAnchor="middle"
                    fill="hsl(var(--gold))"
                    style={{ pointerEvents: 'none' }}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Edge hit-targets (so designers can click a thin line to select it). */}
        <svg
          className="absolute inset-0"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ pointerEvents: 'none' }}
        >
          {edgeGeometry.map(({ index, ax, ay, bx, by }) => (
            <line
              key={index}
              x1={ax} y1={ay} x2={bx} y2={by}
              stroke="transparent"
              strokeWidth={2.5}
              vectorEffect="non-scaling-stroke"
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setSelection({ kind: 'edge', index });
              }}
            />
          ))}
        </svg>

        {/* Nodes */}
        {nodes.map(n => {
          const box = boxOf(n);
          const isSelected = selection.kind === 'node' && selection.id === n.id;
          const isConnectSource = connect.active && connect.sourceId === n.id;
          return (
            <div
              key={n.id}
              onPointerDown={(e) => onPointerDownNode(e, n)}
              className="absolute rounded-md border bg-background/95 shadow-sm overflow-hidden"
              style={{
                left:   `${box.x}%`,
                top:    `${box.y}%`,
                width:  `${box.w}%`,
                height: `${box.h}%`,
                borderColor: isSelected || isConnectSource ? 'hsl(var(--gold))' : 'hsl(var(--border))',
                borderWidth: isSelected || isConnectSource ? 2 : 1,
                cursor: connect.active ? 'crosshair' : (drag.kind === 'move' && drag.nodeId === n.id ? 'grabbing' : 'grab'),
                zIndex: isSelected ? 10 : 1,
              }}
            >
              {/* Title bar */}
              <div
                className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider truncate"
                style={{
                  background: isSelected ? 'hsl(var(--gold))' : 'hsl(var(--surface-2))',
                  color: isSelected ? 'hsl(var(--background))' : 'hsl(var(--foreground))',
                }}
                title={`${n.title} (id: ${n.id})`}
              >
                {n.title || n.id}
              </div>
              {/* Field rows — preview only, mirrors the runtime palette so the
                  designer recognises pk/fk highlighting at a glance. */}
              <div className="text-[9px] leading-tight">
                {(n.fields ?? []).map((f, i) => (
                  <div
                    key={i}
                    className="px-2 py-[2px] flex items-center justify-between gap-2 border-t border-border/50"
                    style={{
                      color:
                        f.role === 'pk' ? 'hsl(var(--gold))' :
                        f.role === 'fk' ? 'hsl(var(--ember))' :
                        'hsl(var(--foreground))',
                    }}
                  >
                    <span className="truncate font-medium">{f.name}</span>
                    {f.type && <span className="text-muted-foreground truncate">{f.type}</span>}
                  </div>
                ))}
              </div>
              {/* Right-edge resize handle */}
              <div
                onPointerDown={(e) => onPointerDownResize(e, n)}
                className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize hover:bg-gold/40"
                aria-label={`Resize ${n.title}`}
                title="Drag to resize width"
              />
            </div>
          );
        })}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground text-[12px] max-w-[280px] px-6">
              No {nodeNoun.toLowerCase()}s yet. Click <span className="text-foreground">Add {nodeNoun.toLowerCase()}</span> to drop one onto the canvas, then drag to position.
            </div>
          </div>
        )}
      </div>

      {/* Side panel — selection details */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onChange={(patch) => updateNode(selectedNode.id, patch)}
          onDelete={() => deleteNode(selectedNode.id)}
          nodeNoun={nodeNoun}
        />
      )}
      {selectedEdge && selection.kind === 'edge' && (
        <EdgeDetailPanel
          edge={selectedEdge}
          nodes={nodes}
          onChange={(patch) => updateEdge(selection.index, patch)}
          onDelete={() => deleteEdge(selection.index)}
          edgeNoun={edgeNoun}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Detail panels                                                      */
/* ------------------------------------------------------------------ */

function NodeDetailPanel({
  node,
  onChange,
  onDelete,
  nodeNoun,
}: {
  node: DiagramNodeSpec;
  onChange: (patch: Partial<DiagramNodeSpec>) => void;
  onDelete: () => void;
  nodeNoun: string;
}) {
  const updateField = (i: number, patch: Partial<DiagramFieldSpec>) => {
    const next = (node.fields ?? []).map((f, idx) => (idx === i ? { ...f, ...patch } : f));
    onChange({ fields: next });
  };
  const removeField = (i: number) => {
    onChange({ fields: (node.fields ?? []).filter((_, idx) => idx !== i) });
  };
  const addField = () => {
    onChange({ fields: [...(node.fields ?? []), { name: 'field', type: 'text', role: 'plain' }] });
  };

  return (
    <div className="rounded-md border border-gold/40 bg-surface-1/60 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
          {nodeNoun} · {node.id}
        </h4>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onDelete}
          aria-label={`Delete ${nodeNoun}`}
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="ID" value={node.id} onChange={v => onChange({ id: slugify(v) })} placeholder="users" />
        <TextField label="Title" value={node.title} onChange={v => onChange({ title: v })} placeholder="Users" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumField label="X (%)" value={node.x} onChange={v => onChange({ x: v })} min={0} max={100} />
        <NumField label="Y (%)" value={node.y} onChange={v => onChange({ y: v })} min={0} max={100} />
        <NumField label="W (%)" value={node.w ?? 22} onChange={v => onChange({ w: v })} min={MIN_W_PCT} max={MAX_W_PCT} />
      </div>
      <Field label="Fields" hint="Drag the canvas to reposition. PK = primary, FK = foreign.">
        <div className="space-y-2">
          {(node.fields ?? []).map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={f.name}
                onChange={e => updateField(i, { name: e.target.value })}
                placeholder="name"
                className="flex-1 text-[12px] font-mono"
              />
              <Input
                value={f.type ?? ''}
                onChange={e => updateField(i, { type: e.target.value })}
                placeholder="type"
                className="w-24 text-[12px] font-mono"
              />
              <select
                value={f.role ?? 'plain'}
                onChange={e => updateField(i, { role: e.target.value as DiagramFieldSpec['role'] })}
                className="h-8 rounded-md border border-input bg-background px-2 text-[11px]"
              >
                {ROLE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeField(i)}
                aria-label={`Remove field ${f.name}`}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={addField} className="w-full gap-1">
            <Plus className="h-3.5 w-3.5" /> Add field
          </Button>
        </div>
      </Field>
    </div>
  );
}

function EdgeDetailPanel({
  edge,
  nodes,
  onChange,
  onDelete,
  edgeNoun,
}: {
  edge: DiagramEdgeSpec;
  nodes: DiagramNodeSpec[];
  onChange: (patch: Partial<DiagramEdgeSpec>) => void;
  onDelete: () => void;
  edgeNoun: string;
}) {
  const nodeOpts = nodes.map(n => ({ value: n.id, label: `${n.title || n.id} (${n.id})` }));
  const [a, b] = edge.cardinality ?? ['1', 'N'];
  return (
    <div className="rounded-md border border-gold/40 bg-surface-1/60 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold inline-flex items-center gap-1">
          {edgeNoun} <MoveRight className="h-3.5 w-3.5" />
        </h4>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onDelete}
          aria-label={`Delete ${edgeNoun}`}
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SelectField
          label="From"
          value={edge.from}
          options={nodeOpts.length ? nodeOpts : [{ value: edge.from, label: edge.from }]}
          onChange={v => onChange({ from: v })}
        />
        <SelectField
          label="To"
          value={edge.to}
          options={nodeOpts.length ? nodeOpts : [{ value: edge.to, label: edge.to }]}
          onChange={v => onChange({ to: v })}
        />
      </div>
      <TextField
        label="Label (verb)"
        value={edge.label ?? ''}
        onChange={v => onChange({ label: v || undefined })}
        placeholder="writes / depends on / contains"
      />
      <div className="grid grid-cols-2 gap-2">
        <SelectField
          label="From cardinality"
          value={a}
          options={CARDINALITY_OPTS as unknown as ReadonlyArray<{ value: '1' | 'N'; label: string }>}
          onChange={v => onChange({ cardinality: [v as '1' | 'N', b] })}
        />
        <SelectField
          label="To cardinality"
          value={b}
          options={CARDINALITY_OPTS as unknown as ReadonlyArray<{ value: '1' | 'N'; label: string }>}
          onChange={v => onChange({ cardinality: [a, v as '1' | 'N'] })}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function NumField({
  label, value, onChange, min, max,
}: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <Field label={label}>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={1}
        onChange={e => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(clamp(n, min, max));
        }}
        className="text-[12px] font-mono"
      />
    </Field>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function slugify(s: string): string {
  const cleaned = s.toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return cleaned || 'node';
}
function freshNodeId(existing: DiagramNodeSpec[]): string {
  const used = new Set(existing.map(n => n.id));
  let i = existing.length + 1;
  while (used.has(`n${i}`)) i++;
  return `n${i}`;
}
