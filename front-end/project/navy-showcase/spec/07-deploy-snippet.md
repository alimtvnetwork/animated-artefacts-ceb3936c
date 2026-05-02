# 07 — Deploy Snippet

**Type**: `CodeBlockSlide` (v0.180)

## Purpose
Show a real Friday-deploy script end-to-end. **Exercises every CodeBlockSlide
animation knob** that ships in v0.180:

- `codeSyntax: "shiki"` — runs shiki against the deck's `mono` font (JetBrains
  Mono on the navy-blue theme).
- `codeHighlightLines: [3, 8, 12, 13]` — 1-based; gold/cyan backdrop pulses in
  sequence on slide enter (250ms stagger, 1.4s settle), then settles into a
  steady muted highlight. Suppressed under `useReducedMotion`.
- `codeShowLineNumbers: true` — auto-on whenever emphasis is set, but pinned
  here for explicitness.
- `codeCopyButton: true` — top-right "Copy" button. Falls back to a
  "Select to copy" hint when `navigator.clipboard` is unavailable.
- `codeCaption` — muted line under the block explaining the highlight pulse.

## Animation contract
- `transition: PushLeft` — comes after the metric grid; lateral push keeps the
  reading direction.
- `textAnimation: FadeIn` — body fades in below the code block.
- Line-emphasis pulse is the slide's own micro-animation layer; it runs after
  the slide-level `transition` settles.

## Speaker notes
Don't read the whole script — point at the four highlighted lines. The copy
button is a live demo: hit it, paste into chat, anyone can run this tomorrow.
