# ERDiagramSlide

Entity-relationship diagram with an automatic **navy-blue palette** — cyan PKs, amber FKs, blue connectors with crow's-foot cardinality. v0.177.

## When to use
- Database schemas, domain models, anything where the audience expects ER conventions.
- For non-ER box-and-line diagrams (architecture, state machines, dep graphs) use `BoxDiagramSlide` — same data shape, but inherits the deck's gold/ember palette.

## Required fields
- `title` (string)
- `entities` (array, 2–20) — alias `diagramNodes` accepted for migration from `BoxDiagramSlide`.

## Optional
- `eyebrow`, `subtitle`, `diagramExplanation` (renders as 4/8 split prose on the left).
- `relationships` (alias `diagramEdges`).

## Field roles
- `role: "pk"` → 🔑 cyan
- `role: "fk"` → 🔗 amber
- `role: "plain"` (default) → cream

## Layout coords
`x` / `y` / `w` are percentages of a 1600×900 SVG canvas — same as `BoxDiagramSlide`, so coordinates copy 1:1.

## Cardinality
Each `relationships[].cardinality` is a `[from, to]` tuple of `'1'` (single tick) or `'N'` (crow's foot). Default `['1', 'N']`.
