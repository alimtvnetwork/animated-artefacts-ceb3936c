# 16 — SvgDiagramSlide (image-examples)

**Type:** `SvgDiagramSlide` · **Pattern:** [`../_patterns/svg-diagram-slide.md`](../_patterns/svg-diagram-slide.md)

## Narrow idea

> A vector figure can hold short labels directly on the image plane.

## Why this slide

Adds a regression sample for the diagram-forward media type so the deck shows
how an SVG asset plus percent-positioned callouts behaves in a maintained deck.

## Authoring rules

- Provide `image` or `svgMarkup`.
- Keep callouts short and few.
- Use `tone` values that map to `.capsule-{tone}` classes.

## Behaviour

| Element | Result |
|---|---|
| `image` | SVG loads as a centered contained figure. |
| `callouts[]` | Labels pin to `%` coordinates over the figure. |
