# 62 — ChecklistSlide

**Status:** Active · **Added:** 2026-05-01 · **Resolves:** ambiguity #32

## Purpose

Audience-facing slide where the presenter walks the room through a list of
items and **clicks to confirm each one as done**. Each item can also expand
to reveal a one-line keyword detail. A gold progress bar at the top tracks
completion.

This is the **resolved surface** for the original "collapsible sections +
per-item expand/collapse + confirm-as-done progress" request (see
`.lovable/question-and-ambiguity/32-collapsible-sections-with-progress.md`).
The other three candidate surfaces (authoring inspector, docs TOC,
release pre-flight) were rejected.

## Narrow idea

> One checklist. The presenter ticks items off live. Progress bar shows
> how far through they are. Nothing else.

## Schema

```ts
ChecklistSlide.content {
  title: string                         // required
  eyebrow?: string
  items: ChecklistItem[]                // 2..7 items (density cap)
  progressColor?: 'gold' | 'ember' | 'cream'  // default 'gold'
}

ChecklistItem {
  text: string                          // required, keyword-first
  detail?: string                       // optional one-line expansion (≤80 chars)
  capsule?: { color: CapsuleColor; text: string }  // optional small tag
}
```

### Density cap

```json
"densityCheck": { "capItems": 7 }
```

Counters: `capItems → content.items.length`. Cap chosen so the slide
stays scannable at presentation distance.

## Behaviour

| Trigger              | Effect                                                   |
| -------------------- | -------------------------------------------------------- |
| Click an item row    | Toggle done (✓ / ◯). Updates progress bar.               |
| Click chevron        | Expand/collapse `detail` (only if `detail` is set).      |
| `Space` / `Enter`    | Toggle done on focused row.                              |
| `→` / `↓`            | Move focus to next item (roving tabindex).               |
| `←` / `↑`            | Move focus to previous item.                             |
| Deck Next/Prev       | Pass through — the slide does NOT consume navigation.    |
| `prefers-reduced-motion` | No collapse animation; instant show/hide. No bar fill tween. |

State is **per-session in component memory** — no localStorage, no URL
hash. The progress resets when the slide unmounts (presenter starts
fresh next walkthrough). This matches the "live confirm" intent and
avoids muddying deep-link semantics.

## Visual

- Each row: number badge (gold) · text · optional capsule · chevron (if `detail`).
- Done state: number → ✓ in gold ring; text gets `text-decoration: line-through` at 0.55 opacity.
- Progress bar: 4px tall, `var(--gold)`, animated from `0%` → `done/total`,
  300ms `expoOut`. Reduced motion → snap.
- Detail panel: collapses with `height: 0 → auto`, 220ms expoOut. Reduced motion → snap.

## Animation tokens

Reuses existing tokens — no new CSS variables required:

- Row entrance: text-animation `Stagger` (60ms cascade, inherited from `slide.textAnimation`).
- Progress fill: 300ms `--ease-expo-out`.
- Detail expand: 220ms `--ease-expo-out`.

## Catalog impact

- `SlideType` enum: 21 → 22.
- `CATALOG.json` `slideTypes.count`: 21 → 22 (+ entry).
- `SLIDE_CONTRACTS_VERSION`: 4 → 5.

## Cross-refs

- Resolution log: `.lovable/question-and-ambiguity/32-collapsible-sections-with-progress.md`
- Density rule: `src/slides/densityCheck.ts`
- Catalog: `spec/21-slides-system/llm/CATALOG.json`
- Type contracts table: `spec/21-slides-system/llm/23-slide-type-contracts.md`
