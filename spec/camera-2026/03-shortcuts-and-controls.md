# 03 — Shortcuts & Controls

> Every way the presenter drives the camera: keyboard, the controller chip, and
> the controller dropdown. All keys are **single-press, no modifier** and are
> ignored while a text input/textarea/contentEditable is focused.
>
> **Pointer-only behaviour:** the mouse cursor auto-hides over the camera
> surfaces (idle ~2.5s, and immediately after a drag/resize), reappearing on
> the next move. This is not a keyboard shortcut — it is the
> `useAutoHideCursor` hook documented in detail in
> [`02-overlay-rendering-and-surfaces.md` §8](./02-overlay-rendering-and-surfaces.md).

## 1. The complete keyboard map

| Key | Action | Active phases | Notes |
|-----|--------|---------------|-------|
| `i` / `I` | **HARD toggle**: suppress↔acquire | any | on/tray/stage → `close()` (stops tracks, camera light OFF). fullscreen → exit then close. off/denied → `show()`. Re-press calls `getUserMedia` again. |
| `m` / `M` | Soft minimize to tray | `on` | Stream stays alive. |
| `f` / `F` | Toggle face auto-frame | `on`, `fullscreen` | Only if `autoFrame.supported`. |
| `+` / `=` | **Zoom in** (grow size step) | `on` | S→M→L→XL. |
| `-` / `_` | **Zoom out** (shrink size step) | `on` | XL→L→M→S. |
| `Esc` | Exit fullscreen / stage | `fullscreen`, `stage` | No-op otherwise (lets modals close). |
| `h` / `H` | Toggle vignette halo | any | Pure visual, default OFF. |
| `1` | Toggle stage-fill | `on`, `stage` | Ignored elsewhere (no surprise prompts). |
| `O` | Toggle circle / rectangle frame | any | Persisted, shows toast. |
| `P` | Enter fullscreen | any (auto-acquires) | CSS layer, not browser FS. |
| `[` | Exit fullscreen (plain) | `fullscreen` | Instant, no animation. |
| `]` | Cinematic 3-cycle | any | fullscreen→off (squish+whoosh 0.8s) · off/tray→on (bouncy fade) · on/stage→fullscreen (bouncy zoom). Reduced-motion = instant + silent. |
| `←/→/Space/Enter/PageUp/PageDown` | Slide nav passthrough | `fullscreen`, `stage` | Forwarded to deck (file 02 §6). |

> **"Zoom in / zoom out"** the user asked about = `+` / `-` (stepped) for the
> footprint, plus the bottom-right **drag handle** for free 16:9 resize, plus
> the face-zoom inside auto-frame (file 04).

## 2. The keydown listener (guarded)

```ts
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;             // don't steal combos
    const t = e.target as HTMLElement | null;
    if (t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable) return;
    const key = e.key, phase = state.phase;

    if (key === 'Escape') {
      if (phase === 'fullscreen' || phase === 'stage') { e.preventDefault(); exitFullscreen(); }
      return;
    }
    // While fullscreen/stage, let nav keys fall through to the capture handler.
    if ((phase === 'fullscreen' || phase === 'stage') &&
        ['ArrowRight','ArrowDown','Enter',' ','PageDown','ArrowLeft','PageUp'].includes(key)) return;

    if (key === 'i' || key === 'I') {
      e.preventDefault();
      if (phase === 'on' || phase === 'tray' || phase === 'stage') close();
      else if (phase === 'fullscreen') { exitFullscreen(); queueMicrotask(() => close()); }
      else void show();
      return;
    }
    if (key === 'm' || key === 'M') { if (phase !== 'on') return; e.preventDefault(); toggleMinimized(); return; }
    if (key === 'f' || key === 'F') {
      if (!autoFrame.supported) return;
      if (phase !== 'on' && phase !== 'fullscreen') return;
      e.preventDefault(); autoFrame.toggle(); return;
    }
    if (key === '+' || key === '=') { if (phase !== 'on') return; e.preventDefault(); growSize(); return; }
    if (key === '-' || key === '_') { if (phase !== 'on') return; e.preventDefault(); shrinkSize(); return; }
    if (key === 'h' || key === 'H') { e.preventDefault(); toggleHalo(); return; }
    if (key === '1') { if (phase !== 'on' && phase !== 'stage') return; e.preventDefault(); toggleStage(); return; }
    // O / P / [ / ] handled by the v5 listener (toggleCircleShape / enterFullscreen / exitFullscreen / runCinematicCycle)
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [state.phase, hide, show, close, exitFullscreen, toggleMinimized, autoFrame, growSize, shrinkSize, toggleHalo, toggleStage]);
```

## 3. The controller chip (`PresenterWebcamButton`)

A 32×32 round chip in the controller bar. Idle (camera off) it does a subtle
"squiggle" every ~6s to advertise itself. States drive icon + color:

```ts
const isOn = state.phase === 'on';
const isHidden = state.phase === 'tray' || state.phase === 'fullscreen';
const isRequesting = state.phase === 'requesting';
const isDenied = state.phase === 'denied';
// icon: requesting → <Loader2 spin/>, on||hidden → <VideoOff/>, else <Video/>
// onClick → void toggle()
// styling: on = gold ring; denied = destructive ring; else = card/cream
// aria-pressed={isOn}, data-state={state.phase}
```

## 4. The controller dropdown (hamburger)

The bottom-right controller pill carries a Menu dropdown that ALSO exposes the
presenter affordances (Overview G, Presenter view, Top Talk Jumper J, Reveal
hints, Contrast, Reduce motion, Keyboard map). Camera items (circle toggle,
stage, halo) can be surfaced here too. The single `SHORTCUTS` table in
`KeyboardShortcutsDialog.tsx` is the source of truth — reuse it; never duplicate
the list.

## 5. The shortcuts dialog (`/`)

Pressing `/` opens a Radix dialog listing all shortcuts (including the camera
keys above). `Esc` closes it. Keep the camera rows in the shared `SHORTCUTS`
array so the dialog and the dropdown stay identical.

Continue to [`04-autoframe-face-tracking.md`](./04-autoframe-face-tracking.md).
