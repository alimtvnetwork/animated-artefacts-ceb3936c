# 15 — GifLoopSlide (image-examples)

**Type:** `GifLoopSlide` · **Pattern:** [`../_patterns/gif-loop-slide.md`](../_patterns/gif-loop-slide.md)

## Narrow idea

> A looping asset should still have an accessible still-frame fallback.

## Why this slide

Adds a real regression sample for the animated-media type so the `image-examples`
deck covers both runtime paths: GIF by default, poster under reduced-motion.

## Authoring rules

- `content.image` is the GIF.
- `content.poster` is the static fallback.
- `freezeOnReducedMotion: true` forces the still-frame path for deterministic QA.

## Behaviour

| State | Result |
|---|---|
| Default motion | The looping GIF renders centered on stage. |
| Reduced motion / forced freeze | The poster image renders instead. |
