---
name: webcam-overlay
description: Webcam-on-slide feature. RESEARCH STAGE only — schema designed, runtime NOT yet implemented. Deck-level singleton overlay (NOT a SlideType). Per-slide JSON `content.webcam: WebcamSpec`. ONE getUserMedia call per deck mount, shared across slides. Smooth Framer-Motion layout spring between per-slide placements. Audio always off. Mirror by default. Never auto-prompt — user clicks "Camera" toggle in controller. PNG/PDF export omits webcam. Spec: `spec/slides/51-webcam-overlay.md`. Research: `spec/research/01-webcam-overlay.md`. LLM guide: `spec/slides/llm/20-webcam-overlay.md`.
type: feature
---

# Webcam overlay (RESEARCH STAGE — do not implement yet)

## Status

Schema + LLM authoring guide written. Runtime files NOT created. Wait
for the user to say "build the webcam overlay" before adding any
`src/slides/components/WebcamOverlay.tsx` etc.

## Locked rules (already binding even pre-implementation)

1. **One stream per deck.** `getUserMedia` runs ONCE on first
   activation; the resulting `MediaStream` is shared across every
   slide. Never re-acquire on slide change.
2. **Slide-level field.** `content.webcam: WebcamSpec`. Never on
   `step.*`, never per-capsule.
3. **Deck-level singleton overlay.** Mounted once at the deck root
   (`SlideStage`). Reads the active slide's `webcam` and morphs its
   wrapper position via `layout` spring. Video element never
   unmounts.
4. **Opt-in per slide.** Default behaviour = no webcam.
5. **Audio always off.** Period.
6. **Mirror by default.** `mirror: true` matches presenter expectation.
7. **Manual permission.** Controller "Camera" toggle is the only
   trigger; no auto-prompt.
8. **Static export omits webcam.** PNG/PDF exports are archival —
   webcam is a live performance element.

## Schema (frozen)

```ts
interface WebcamSpec {
  placement: 'top-right'|'top-left'|'bottom-right'|'bottom-left'|'center'
           | { x:number; y:number; w:number; h:number };
  size?: 'sm'|'md'|'lg';
  enter?: 'fade'|'blur'|'fade-blur'|'none';
  zoom?: number;            // 1.0 – 3.0
  crop?: 'cover'|'auto-frame';   // 'auto-frame' = v2, MediaPipe
  shape?: 'rounded'|'circle'|'square';
  border?: 'none'|'gold'|'cream';
  shadow?: boolean;
  mirror?: boolean;
}
```

## Implementation forecast (when the user greenlights it)

| File | Role |
|---|---|
| `src/slides/components/WebcamOverlay.tsx` | Visible component + entrance + layout-spring |
| `src/slides/webcam.ts` | Singleton stream manager (mirrors `sound.ts`) |
| `src/slides/types.ts` | `SlideContent.webcam` |
| `src/slides/SlideStage.tsx` | Mount overlay at deck root |
| `src/builder/ContentFieldEditor.tsx` | New `webcam` field renderer |
| `src/pages/SettingsPage.tsx` | Device picker + permission readout |

## v1 vs v2

- **v1**: `crop: 'cover'` only. No MediaPipe. Ships everything else.
- **v2**: `crop: 'auto-frame'` lazy-loads MediaPipe face detector;
  silent fallback to `'cover'` on failure.

## Cross-references

- Spec: `spec/slides/51-webcam-overlay.md`
- Research: `spec/research/01-webcam-overlay.md`
- LLM guide: `spec/slides/llm/20-webcam-overlay.md`
