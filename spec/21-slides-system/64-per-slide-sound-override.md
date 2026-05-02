# Spec 64 — Per-Slide Sound Override (JSON Path Reference)

> **Status:** Stable. Companion to spec 21 (Slide Sound System) and 43 (Steps Sound).
> **Codename:** "sound override".
> **Source of truth:** `src/slides/types.ts` (`SlideSpec.sound`), `src/slides/sound.ts`.

This doc fixes the **canonical JSON path** for overriding per-slide audio cues so authors and LLMs touching deck JSON have one unambiguous answer.

---

## 1. Canonical JSON path

```
slides[i].sound
```

That is: the `sound` block lives **at the top level of each slide spec**, sibling to `slideType`, `transition`, `textAnimation`, `content`, `clickReveal`, etc. **NOT** inside `content`. **NOT** inside `transition`. **NOT** at deck root.

```jsonc
{
  "id": "s12",
  "slideName": "Architecture",
  "slideType": "StepTimelineSlide",
  "transition": "PushIn",
  "textAnimation": "FadeIn",

  "sound": {                  // ← canonical path
    "on": "enter",            // 'enter' | 'focus' | 'click'
    "kind": "whoosh",         // 'whoosh' | 'click' | 'pop' | 'zoom' | 'fadeZoom'
    "volume": 0.5,            // 0..1, optional
    "mute": false             // optional hard kill
  },

  "content": { /* ... */ }
}
```

## 2. Override precedence (highest wins)

1. `slides[i].sound.mute === true` → silent, no other field consulted.
2. `slides[i].sound.kind` + `slides[i].sound.volume` → per-slide override.
3. **Slide-type defaults** (e.g. `AdvanceStepSlide` defaults `on: 'focus'`, `kind: 'whoosh'`).
4. **Deck-level defaults** in `slides.json` manifest → `defaults.sound` (optional).
5. **System defaults** from `src/slides/sound.ts` (whoosh @ 0.45, click @ 0.35, etc.).

Per-slide `sound` is a **partial** — omitted fields fall through to the next layer. Setting `kind` alone keeps the slide-type's default `on` trigger.

## 3. Step-level override (StepTimeline / AdvanceStep / StepsChain3D)

Sub-step cues use `slides[i].content.steps[j].sound` (same shape). This overrides the parent slide's `sound` block **for that focus event only**:

```jsonc
"content": {
  "steps": [
    { "title": "Discovery", "sound": { "kind": "pop", "volume": 0.6 } },
    { "title": "Build" }   // inherits slide.sound or defaults
  ]
}
```

## 4. What is NOT a valid override path

| ❌ Path | Why it doesn't work |
|--------|---------------------|
| `slides[i].content.sound` | Reserved for nothing; loader ignores. |
| `slides[i].audio` | Legacy alias removed in v0.37.0. |
| `deck.sound` | Use `manifest.defaults.sound` instead. |
| `slides[i].transition.sound` | Transitions don't carry audio config. |

## 5. Mute scopes

- **Single slide:** `slides[i].sound.mute = true`
- **Single step:** `steps[j].sound.mute = true`
- **Whole deck:** `slides.json` → `defaults.sound.mute = true`
- **User session:** Settings page toggle (persisted in `localStorage`, beats all JSON).

## 6. Cross-references

- Spec 21 — Sound System (synth/asset table, debounce rules)
- Spec 43 — Steps Sound (focus-trigger cadence)
- `src/slides/sound.ts` — runtime resolver
- `src/slides/types.ts` — `SoundSpec` type
