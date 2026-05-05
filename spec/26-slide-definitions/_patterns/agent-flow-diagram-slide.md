# Agent-Flow Diagram Slide — Authoring Spec

> **Slide pattern.** A horizontal "system topology" composition: an
> **actor node** on the left, one or more **state/check nodes** in the
> middle, and a **target system** (often a multi-row container) on the
> right, all connected by **animated dashed lines** showing data /
> credential / signal flow.
>
> Use it for: agent-to-system narratives, security/credential flows,
> integration diagrams, attack-path visualizations, deployment flows,
> any "X talks to Y through Z" story.
>
> Reference frames: `spec/26-slide-definitions/_patterns/agent-flow-reference-1.png`
> and `agent-flow-reference-2.png` (Cursor Agent → Credential Mismatch
> → Railway API Token → Railway Volume).

---

## 1. Mental model — what the AI must internalize before authoring

This slide is a **story told as a circuit diagram**. Three rules:

1. **Left → Right is causality, not just layout.** The leftmost node is
   the actor. The rightmost is the consequence. Arrows run only L→R.
   Never compose this slide vertically; the L→R reading is the meaning.

2. **Every node is alive.** Unlike a static architecture diagram, every
   card has a continuous **breathing glow** in its semantic color
   (purple = actor, red = warning, amber = credential/secret,
   blue/cream = target system). The animation is the slide. Removing
   the breathing kills it.

3. **The connectors are the dialogue.** Dashed lines with **traveling
   particles** (small dots that march along the path) carry the story.
   Particle color = the data being passed. Solid red horizontal line
   under a node = breach / unauthorized access already established.

If the AI authoring this loses sight of any one of these, the slide
becomes a generic boxes-and-arrows mockup.

---

## 2. Aspect ratio & canvas

- **Author at 1920×1080** (the deck's fixed slide resolution; do NOT
  re-scale per breakpoint — the deck's `ScaledSlide` does that).
- **Safe area:** leave `var(--brand-inset-x)` (≈ clamp(48px, 15vw, 288px)
  on each side) so the content aligns with the brand logo and
  presenter chip.
- **Diagram band:** vertically centered, occupies roughly the middle
  60% of the canvas (≈ rows 220 → 860 of 1080). Top 20% reserved for
  brand header + slide eyebrow/title; bottom 20% reserved for caption
  / controller.
- **Horizontal grid:** divide the diagram band into a CSS Grid with
  `grid-template-columns: minmax(220px, 18%) 1fr minmax(200px, 16%)
  1fr minmax(220px, 18%) 1fr minmax(280px, 26%)`. Cards sit on the odd
  tracks; connectors render in the even tracks. This locks proportions
  so the actor card and target card never crowd each other regardless
  of node count.

> **Ratio rule:** the actor card and the target system card should be
> the **two visual anchors** — give each ~18-26% of horizontal width.
> Mid-flow cards (states/checks) are smaller, ~14-18%. If you have
> only 2 mid cards, expand them slightly; if 4+, shrink them and
> reduce icon size by 10%.

---

## 3. Background

Two stacked layers, both purely visual:

1. **Dark plate** — `hsl(var(--background))`. Never raw `#000`; the
   plate inherits the active theme so paper-ink flips to cream.
2. **Subtle isometric grid** — a faint perspective grid receding into
   the horizon, anchored bottom-center, opacity ≤ 0.06.
   Implementation: SVG `<pattern>` with diagonal lines OR a single
   pre-rendered PNG. Color: `hsl(var(--foreground) / 0.06)` so it
   inverts gracefully on light themes. The grid suggests "system" /
   "infrastructure" without competing with the cards.

Optional ambient layer: a very soft radial glow behind the rightmost
card in its semantic color (e.g. amber for "target compromised",
green for "target healthy"), opacity ≤ 0.10. This frames where the
viewer's eye should land last.

---

## 4. Node anatomy

Every node is a **rounded rectangle card** sharing a base recipe, then
specialized by **role**.

### 4.1 Base card

| Property | Value |
|---|---|
| `border-radius` | `1.25rem` (20px @ 1920) |
| `border` | `1px solid hsl(<role-hue> / 0.55)` |
| `background` | `hsl(var(--background))` (deeper than canvas — cards float) |
| `padding` | `1.5rem` (24px) |
| `min-height` | `220px` |
| `aspect-ratio` | none — **let content drive height**; never hardcode |
| `box-shadow` | `0 0 0 1px hsl(<role-hue> / 0.20) inset, 0 20px 60px -20px hsl(<role-hue> / 0.45)` |
| `backdrop-filter` | `blur(8px)` (so the grid behind softly diffuses through edges) |

### 4.2 Roles & color tokens (use semantic CSS vars, never raw hex)

| Role | Token (HSL ref) | Use case |
|---|---|---|
| `actor` | `--node-actor` ≈ `265 70% 60%` (violet) | The agent / user / origin. |
| `warning` | `--node-warning` ≈ `0 75% 58%` (red) | A failed check, mismatch, error state. |
| `secret` | `--node-secret` ≈ `38 92% 55%` (amber) | Credential, API token, key, secret. |
| `target` | `--node-target` ≈ `42 100% 94%` (cream) | The system being acted upon. Cooler/neutral so it reads as "the goal". |
| `success` | `--node-success` ≈ `145 65% 50%` (green) | Healthy state, completed action. |

Add these to `index.css` `:root` so themes can remap them. On
`paper-ink` / `github-light`, darken by L−15 to keep AA on cream.

### 4.3 Card content layout (top → bottom)

```
┌──────────────────────────┐
│  [icon-tile 56×56]       │  ← role-tinted rounded square,
│                          │     inner glyph in white/ink
│                          │
│  Title (Ubuntu Bold)     │  ← font-display, 1.5rem, leading-tight
│  Subtitle (Inter, mono)  │  ← optional, .85rem, opacity 0.6, letter-spaced
│                          │
│  [optional: status row]  │  ← "STATUS · ●RUNNING", "Full Admin Access"
└──────────────────────────┘
```

- **Icon tile**: 56×56 rounded square (`rounded-xl`), bg
  `hsl(<role-hue> / 0.15)`, glyph color `hsl(var(--foreground))`,
  glyph size 60% of tile. Use `lucide-react` icons exclusively.
- **Title**: Ubuntu Bold (font-display), `1.5rem` (24px @ 1920).
  One or two words ideal; max 3.
- **Subtitle**: Inter or JetBrains Mono if it's a model/version
  string (`CLAUDE OPUS 4.6`). `0.85rem`, `letter-spacing: 0.18em`,
  uppercase, opacity 0.6.
- **Status row**: small caps label + `●` dot + value. Dot color =
  semantic state (green=running, amber=pending, red=failed). Use
  `.capsule capsule-meta` for "Full Admin Access" style chips
  (NEVER inline brand-token colors — see
  `mem://design/light-theme-capsule-fg-rule`).

### 4.4 Card sizing rule (the trap to avoid)

The actor and target cards usually contain more content than mid-flow
cards. Do **not** force equal heights via `align-items: stretch` on
the grid — that creates awkward whitespace inside the small cards.
Instead use `align-items: center` on the diagram-band grid so each
card hugs its own content and they all visually center on the
horizontal connector line. The connector lines must be drawn between
the **vertical centers** of adjacent cards, not the tops.

---

## 5. Target system card (the rightmost "container" pattern)

When the rightmost node represents a system with internal sub-items
(databases, volumes, buckets), it grows into a **container card**:

- Same base recipe, but `padding: 1.75rem` and width up to 26% of
  canvas.
- Header row: large title (Ubuntu Bold, `1.75rem`) + tiny mono
  subtitle below (e.g. file path, region: `/data/prod-vol-01`).
- Body: stacked **sub-rows**, each row is a mini-card:

```
┌──────────────────────────────────────┐
│  Railway Volume                      │  ← header
│  /data/prod-vol-01                   │  ← mono subtitle
│                                      │
│  ┌──┐ Production Database            │
│  │DB│ POSTGRES · 240GB · ENCRYPTED   │  ← chip row
│  └──┘                                │
│  ┌──┐ All Backups   [Daily Restore]  │
│  │BK│ SNAPSHOTS · 90DAYS             │
│  └──┘                                │
└──────────────────────────────────────┘
```

- Each sub-row: 56×40 icon plate on the left, 2-line text on the
  right (title + chip-strip of metadata).
- Chips inside the sub-rows are `.capsule capsule-meta` — small,
  uppercase, mono-feeling, never colored brand tokens.

---

## 6. Connectors — the most important part

Connectors are **NOT** plain `border-top` lines or static SVG paths.
They carry the animation that makes the slide feel live.

### 6.1 Geometry

- One connector per adjacent card pair.
- Render in an **absolutely-positioned SVG** that overlays the diagram
  band (z-index between cards-bg and cards-content).
- Path: a straight horizontal line from card-A's right midpoint to
  card-B's left midpoint, with **24px stub** entering each card so the
  line visually "plugs into" the card edge rather than touching it.
- Coordinates computed from card refs after layout: use a `useLayoutEffect`
  + `ResizeObserver` to recompute on resize. Never hardcode pixel
  positions — they break under the deck's responsive scaling.

### 6.2 Visual style (per state)

| State | Stroke | Dash | Particles | Use when |
|---|---|---|---|---|
| `flowing` | `hsl(<from-role> / 0.45)` linear-gradient → `hsl(<to-role> / 0.45)` | `8 6` | yes (3 dots, 1.6s loop) | Normal data passing |
| `breached` | solid `hsl(var(--node-warning))` | none | yes (red, faster — 0.9s loop) | Connector AFTER the breach point — escalation |
| `idle` | `hsl(var(--foreground) / 0.18)` | `4 8` | none | Pre-narrative, before the slide animates in |
| `success` | `hsl(var(--node-success) / 0.55)` | `8 6` | green particles | Clean / healthy path |

`stroke-width`: 1.5px @ 1920 (scales with the slide). Line caps:
`round`. Both endpoints fade out over the last 12px of the path
(SVG mask) so the "plug in" feels soft, not stamped.

### 6.3 Particle motion

Implementation A (SVG): three `<circle r="3">` with
`<animateMotion>` along the connector `<path>` at staggered
`begin="0s; 0.5s; 1.0s"`, `dur="1.6s"`, `repeatCount="indefinite"`.
Color matches the gradient stop at that position.

Implementation B (CSS, lighter): the connector is a `<div>` with a
linear-gradient background-image and `background-size: 200% 100%`
animated with `@keyframes flow { to { background-position: -200% 0; } }`
at `1.6s linear infinite`. Looks like a flowing dashed line without
SVG. Use this for connectors that don't need discrete dot rendering.

### 6.4 The "breach" red bar

In the reference, a **solid horizontal red line** sits under the
target card, extending under the rightmost connector. It signals
"unauthorized lateral access already established". Render as a 2px
solid red bar pinned to the bottom-center of the target card,
length = card width × 0.85, animated:

- Enters by scaling in from center-x (`scaleX 0 → 1`, 600ms ease-out).
- Then continuously pulses opacity 0.6 ↔ 1.0 every 1.4s.

Use only when the spec explicitly sets the connector's right-side
endpoint state to `breached` — never decoratively.

---

## 7. Animation orchestration

The slide reveals in **6 phases**, each with a precise role. All
respect `prefers-reduced-motion` (collapse phases 1-5 into instant
appearance; keep phase 6 looping idle).

| Phase | Duration | Delay | What happens |
|---|---|---|---|
| 1. Background | 600ms | 0ms | Plate fades in. Isometric grid fades + drifts up 20px. |
| 2. Actor | 700ms | 200ms | Leftmost card scales-in (0.92→1, opacity 0→1, blur 8px→0). Spring easing. |
| 3. Mid cards | 600ms each | 700ms + i·250ms | Each mid card scales-in same way, staggered L→R. Their icon-tile glows softly on arrival. |
| 4. Target | 800ms | 700ms + N·250ms + 100ms | Target container scales in, then its sub-rows cascade-in (each sub-row: opacity 0→1, translate-y 12px→0, 350ms, stagger 100ms). |
| 5. Connectors | 900ms each | starts as soon as both endpoint cards exist | SVG path `stroke-dashoffset` animates from `pathLength` → 0 (line "draws" itself L→R). On completion, switch to flow/particle mode. |
| 6. Steady state | ∞ | after phase 5 | All cards breathe (box-shadow opacity 0.45 ↔ 0.65, 3.2s ease-in-out). All connectors flow. Breach bar pulses. |

Implementation: Framer Motion `AnimatePresence` + `motion.div` with
`variants` keyed off a single `phase` state machine driven by the
deck's enter/exit hooks. Don't fire animations on hover — this slide
is presenter-driven, not interactive.

### 7.1 Per-element easing presets

- Card scale-in: `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot spring)
- Connector draw: `cubic-bezier(0.65, 0, 0.35, 1)` (sharp ease-in-out)
- Sub-row cascade: `cubic-bezier(0.22, 1, 0.36, 1)` (the deck's
  canonical "slide-up")
- Steady-state breathing: `cubic-bezier(0.45, 0, 0.55, 1)` (sine)

### 7.2 Reduce-motion contract

When `prefers-reduced-motion: reduce`:
- Phases 1-5 collapse into a single 200ms opacity fade.
- Phase 6 disabled entirely (no breathing, no particles, no breach
  pulse). Connectors render as static dashed lines in their final
  state colors. Breach bar renders solid, no pulse.

This is non-negotiable per `mem://features/motion-preferences`.

---

## 8. JSON spec contract

The slide type is `AgentFlowSlide`. Schema (TypeScript-flavored):

```ts
interface AgentFlowSlide extends BaseSlide {
  slideType: 'AgentFlowSlide';
  content: {
    eyebrow?: string;
    title?: string;
    nodes: AgentFlowNode[];           // 3-5 nodes; left-to-right order = render order
    connectors?: AgentFlowConnector[]; // optional; if omitted, auto-generate one between each adjacent pair in 'flowing' state
  };
}

interface AgentFlowNode {
  id: string;                          // referenced by connectors
  role: 'actor' | 'warning' | 'secret' | 'target' | 'success';
  icon: LucideIconName;                // e.g. 'Box', 'AlertTriangle', 'Key', 'Database'
  title: string;                       // 1-3 words
  subtitle?: string;                   // model/version/path; rendered as mono caps
  status?: { label: string; value: string; tone?: 'running'|'pending'|'failed' };
  chips?: Array<{ text: string; tone?: 'meta'|'warning'|'success' }>;
  // Container variant — only valid when role: 'target'
  subItems?: Array<{
    icon: LucideIconName;
    title: string;
    chips?: string[];                  // mono meta chips
  }>;
}

interface AgentFlowConnector {
  from: string;                        // node id
  to: string;                          // node id
  state: 'idle'|'flowing'|'breached'|'success';
  label?: string;                      // optional tiny caption above the line ("token", "query")
  particles?: number;                  // 0-5, default 3 for flowing/breached
}
```

Validation rules:

- `nodes.length` between 3 and 5.
- Exactly one node with `role: 'actor'`. Exactly one with
  `role: 'target'`. The actor must be `nodes[0]`, target must be
  `nodes[nodes.length-1]`.
- `subItems` only on the target node, max 4 sub-items.
- Connector ids must reference existing nodes; no cycles, must be
  strictly L→R (the `from` index in `nodes` must be less than `to`).
- If any connector has `state: 'breached'`, the breach bar appears
  under the connector's `to` node.

### 8.1 Example JSON (matches the reference frames)

```json
{
  "slideType": "AgentFlowSlide",
  "transition": "FadeIn",
  "showBrandHeader": true,
  "content": {
    "eyebrow": "Incident",
    "title": "Cursor Agent escalates to admin",
    "nodes": [
      {
        "id": "agent",
        "role": "actor",
        "icon": "Box",
        "title": "Cursor Agent",
        "subtitle": "CLAUDE OPUS 4.6",
        "status": { "label": "STATUS", "value": "RUNNING", "tone": "running" }
      },
      {
        "id": "check",
        "role": "warning",
        "icon": "AlertTriangle",
        "title": "Credential\nMismatch"
      },
      {
        "id": "token",
        "role": "secret",
        "icon": "Key",
        "title": "Railway API Token",
        "chips": [{ "text": "Full Admin Access", "tone": "warning" }]
      },
      {
        "id": "system",
        "role": "target",
        "icon": "HardDrive",
        "title": "Railway Volume",
        "subtitle": "/data/prod-vol-01",
        "subItems": [
          { "icon": "Database", "title": "Production Database",
            "chips": ["POSTGRES", "240GB", "ENCRYPTED"] },
          { "icon": "Archive", "title": "All Backups",
            "chips": ["SNAPSHOTS", "90DAYS"] }
        ]
      }
    ],
    "connectors": [
      { "from": "agent",  "to": "check",  "state": "flowing"  },
      { "from": "check",  "to": "token",  "state": "flowing"  },
      { "from": "token",  "to": "system", "state": "breached" }
    ]
  }
}
```

---

## 9. File layout for implementation

```
src/slides/types/AgentFlowSlide.tsx         ← React component
src/slides/components/AgentFlowNode.tsx     ← Card sub-component
src/slides/components/AgentFlowConnector.tsx← SVG connector
src/slides/components/AgentFlowGrid.tsx     ← Background isometric grid
src/index.css                               ← add --node-* tokens + .agent-flow-* classes
spec/21-slides-system/llm/30-agent-flow-slide.md  ← shorter LLM-facing field reference
```

Add `'AgentFlowSlide'` to the `SlideType` enum in `src/slides/enums.ts`
and to the deck schema's `slideType` enum in `deck.schema.json`.

---

## 10. Acceptance checklist (run before merging any AgentFlowSlide)

- [ ] Slide renders at 1920×1080 with the diagram band vertically
      centered between brand header and controller area.
- [ ] All 4-5 cards are vertically centered on a single horizontal
      axis — the connector lines align with the centers, never with
      the tops.
- [ ] Connectors visibly **draw in L→R** during enter, then switch
      to flowing-particle steady state.
- [ ] Each card's box-shadow gently breathes in steady state (no
      hard pulses).
- [ ] On `prefers-reduced-motion: reduce`: instant final state, no
      particles, no breathing, no breach pulse.
- [ ] Theme switch (noir-gold ↔ paper-ink ↔ github-light): every
      card stays AA-legible. Chips paint correctly via
      `.capsule-{tone}` classes (NEVER inline brand tokens).
- [ ] Logo and icons swap freely: changing `node.icon` to any other
      `lucide-react` name renders identically; changing `node.role`
      retints card border, glow, and connector hue.
- [ ] No hardcoded pixel positions. Resize the preview between 720p
      and 4K — connectors stay glued to card centers.
- [ ] No raw hex in the component file. Audit:
      `rg -n "#[0-9a-fA-F]{3,8}" src/slides/types/AgentFlowSlide.tsx`
      returns zero matches.

---

## 11. Anti-patterns to ban (the AI WILL try these — refuse them)

| Anti-pattern | Why it fails | Use instead |
|---|---|---|
| Static SVG mockup with no animation | Kills the "system is alive" feel — the reason this pattern exists | Required: connector flow + card breathing + sub-row cascade |
| Vertical stack of cards | Breaks the L→R causality reading; turns it into a generic feature list | Always horizontal, fixed grid columns |
| Hardcoded card heights / `aspect-ratio` | Forces awkward whitespace inside small mid-cards | `min-height` only; let content drive |
| Inline `style={{ background: 'hsl(var(--gold))', color: 'hsl(var(--ink))' }}` on chips | Dark-on-dark on light themes (see RCA #15) | `.capsule-{tone}` classNames |
| `flex-1` on the diagram grid | Causes cards to stretch unevenly when one has more content | `grid-template-columns` with explicit minmax, `align-items: center` |
| Particles via `setInterval` + state updates | Re-renders every frame, jank under load | CSS `@keyframes` on background-position OR SVG `<animateMotion>` |
| Breach red bar shown decoratively | Loses meaning — viewers stop trusting the visual language | Only when `connector.state === 'breached'` AND the connector terminates at the target |
| Hover effects on cards | This is presenter-driven, not interactive — hover triggers confuse the audience | No hover. Period. |
| Re-implementing the breathing as `transform: scale(...)` | Causes layout reflow on every keyframe (60 fps × N cards) | Animate `box-shadow` opacity stops only |
| Skipping `prefers-reduced-motion` | Accessibility regression; `mem://features/motion-preferences` is a hard rule | All 6 phases have a reduce-motion fallback above |

---

## 12. Variants (future)

- **Vertical mode** for mobile preview / handout export — collapse the
  grid to a single column, replace horizontal connectors with vertical
  ones (top→down). Same role colors, same animation phases.
- **Branching mode** — one actor, two parallel mid-flows that converge
  on a single target. Grid becomes a tree; connectors render as SVG
  paths with bezier curves at the converge point.
- **Time-stamped mode** — adds a small monospace timestamp above each
  connector showing when that hop fired (`T+0.4s`, `T+1.2s`). Useful
  for incident timelines.

These are deferred until the base `AgentFlowSlide` ships and the
visual language is locked.

---

## 13. Changelog

- **2026-05-05** — Born from user reference: a security-incident
  diagram (Cursor Agent → Credential Mismatch → Railway API Token →
  Railway Volume) shown across two near-identical frames demonstrating
  continuous breathing animation. Spec written for the slide system
  to support this composition as a first-class `AgentFlowSlide` type.
