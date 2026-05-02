---
name: debug-overlays
description: Three boot-time debug surfaces that prove the BrandStrip ban is enforced — audit overlay (lists stripped fields), debug overlay (stage vs preview DOM diff), and constraint inspector (live probe of every memory constraint). All gated behind URL flags + keyboard shortcuts.
type: feature
---

## Files
- `src/slides/components/BrandStripAuditOverlay.tsx` — bottom-right pill, always-on. Renders nothing when `brandStripAudit` is empty.
- `src/slides/components/BrandStripDebugOverlay.tsx` — bottom-left, gated. Mounts active slide via SlideStage AND SlidePreview off-screen, scans both for BrandStrip selectors, flags any divergence.
- `src/slides/components/ConstraintInspectorPanel.tsx` — top-right, gated. Reads every `.lovable/memory/constraints/*.md` at build time via Vite glob and runs a per-constraint runtime probe.

## Activation
| Surface | URL flag | Keyboard |
|---|---|---|
| Audit overlay | (always on when audit log non-empty) | — |
| BrandStrip diff | `?debug=brandstrip` | Ctrl/Cmd+Shift+B |
| Constraint inspector | `?debug=constraints` | Ctrl/Cmd+Shift+C |

## Constraint probes
Each probe is keyed by the constraint file's `name` frontmatter. Today only
`no-brand-strip` has a probe; new constraints fall back to "no runtime probe
registered" (visible but unverified).

`no-brand-strip` probe checks:
1. `resolveBrandStrip()` returns null for every loaded slide.
2. `brandStripAudit` array exists (boot-time strip pass ran).
3. Live document has no element matching `[aria-label="Branded strip"]`,
   `[data-brand-strip]`, or `.brand-strip`.

The panel re-runs all probes every 1s while open, so a banner re-enabled
mid-session shows up without manual rescan.

## Adding a new constraint probe
1. Drop `<name>.md` in `.lovable/memory/constraints/` with frontmatter
   `name`, `description`, `type: constraint`.
2. Add a `<name>: probe` entry to the `PROBES` map in
   `ConstraintInspectorPanel.tsx`. The probe returns `{ enforced, detail, evidence[] }`.
3. The inspector picks it up automatically on next reload.

## Rule
Do NOT remove or weaken these overlays without the user's explicit consent.
They are the ratchet that prevents the BrandStrip from being silently
re-enabled by a future "small UI tweak". The audit overlay is permanent;
the diff + inspector are gated so they cost nothing in normal use.
