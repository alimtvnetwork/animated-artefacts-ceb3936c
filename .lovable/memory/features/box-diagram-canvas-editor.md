---
name: BoxDiagram canvas editor
description: v0.183 drag-and-drop authoring surface for diagramNodes/diagramEdges/entities/relationships in the slide builder.
type: feature
---

# BoxDiagram canvas editor (v0.183)

`src/builder/BoxDiagramCanvasEditor.tsx` is the missing authoring UI for `BoxDiagramSlide` and `ERDiagramSlide`. Before v0.183, `diagramNodes`/`diagramEdges`/`entities`/`relationships` had no entry in `ContentFieldEditor` — they fell through to `default: return null`, forcing designers to hand-edit JSON to position boxes (`x`, `y`, `w` in % of stage).

## Surface

A 720×405 (16:9) scaled canvas mirroring the runtime stage (`STAGE_W=1600`, `STAGE_H=900`). Nodes render as positioned `<div>`s with the same pk/fk color treatment as the live renderer (`hsl(var(--gold))` / `hsl(var(--ember))` / `hsl(var(--foreground))`). Edges paint as SVG lines with thicker transparent hit-targets so designers can click thin lines.

## Interactions

- **Move** — drag a node body → updates `x`, `y` clamped to keep the box inside the canvas.
- **Resize** — drag the right-edge handle (1.5px wide) → updates `w`, clamped 12–60%.
- **Connect** — toggle the Connect button, click source node, then target → emits `{from, to, cardinality: ['1','N']}`. Esc cancels mid-flight.
- **Select** — click node or edge → selection ring + side panel form. Click empty canvas (or Esc) to deselect.
- **Delete / Backspace** — removes selected node (cascade-deletes touching edges) or selected edge. Suppressed while an `<input>`/`<select>` has focus so renaming a field doesn't blow away its node.
- **Add node** — drops a new `Untitled` node with offset stagger so repeated clicks don't pile on top of each other; auto-selects.

## Side panel

- **Node**: id (slugified), title, x/y/w numeric fields, fields Repeater (name + type + role select pk/fk/plain).
- **Edge**: from/to selects (populated from current node list), label, two cardinality selects (1 / N).

## Wiring

`ContentFieldEditor` now handles five new field keys. The canvas owns BOTH arrays (nodes + edges) and emits them atomically — to avoid a duplicate surface for ER (which lists both `entities` and `relationships`), the `diagramEdges`/`relationships` cases intentionally `return null`. The schema still lists them so fixtures round-trip cleanly.

- `diagramNodes` → `BoxDiagramCanvasEditor` (Node/Edge nouns)
- `entities` → `BoxDiagramCanvasEditor` (Entity/Relationship nouns)
- `diagramEdges` / `relationships` → `null` (handled by the canvas above)
- `diagramExplanation` → plain `<TextAreaField>` (3 rows)

`fieldSchemas.ts`: `BoxDiagramSlide.fields` now includes `diagramExplanation` (was ER-only) so the textarea surfaces on both slide types.

## Coordinate contract (matches the runtime renderer)

- `x`, `y` are top-left % of the 1600×900 stage.
- `w` is width % (default 22%, clamped 12–60% in the editor).
- Height auto-derives: `NODE_HEADER_H + fields.length * NODE_ROW_H` projected onto stage height. The editor mirrors this formula in `boxOf()` so move-clamping stays accurate.
- All values rounded to one decimal place (`round1`) so the persisted JSON stays clean.
