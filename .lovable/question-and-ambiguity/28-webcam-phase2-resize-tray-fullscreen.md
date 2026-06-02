# 28 — Webcam Phase-2 (resize + tray + fullscreen) ambiguity log

Voice request from MD ALIM UL KARIM, 2026-05-01:

> "Add a plus button for the camera to get bigger… stretch resize section
> using mouse… let's not add shift, just add shortcuts like I and M…
> when we hide the webcam, hide it like a minimized tray… just an icon…
> hover over it then 2 or 3 buttons (full / expand)… add a button to
> make this webcam to full screen… if webcam is in full screen, then any
> right button click should actually go to slides… so pressing on right
> arrow or Enter should go to the right side of the slides… and if we
> press back button, then it will back to the webcam again."

## Resolved with defaults (no-questions mode)

| Code | Ambiguity | Resolution |
|------|-----------|------------|
| **A** | Single-key shortcuts (`i` `m` `f`) collide with deck text inputs. | Guarded — ignored when focus is in `<input>` / `<textarea>` / `[contenteditable]`. Same pattern already used by Shift+F. |
| **B** | "Hide" semantics — does it stop the stream? | NO. Hide = tray icon, stream stays alive forever. The X (close) button keeps the spec-64-v1 hard-stop semantics. |
| **C** | Resize bounds + +/- step granularity. | Stepped: S 240×135, M 320×180 (default), L 480×270, XL 720×405. Free resize: width [160,960], 16:9 locked. |
| **D** | "Press back button → back to webcam" — only the very last action, or always rewind to fullscreen-entry? | Action stack: back exits fullscreen ONLY when the most recent action is `enter-fullscreen`; otherwise it's a deck `goPrev`. So the FIRST back press right after entering fullscreen always returns to the webcam. |
| **E** | "Right button click" — mouse RMB or right arrow key? | Right arrow + Enter + Space + PageDown + ArrowDown (forward keys). Mouse contextmenu untouched (browser default). |

## Why these defaults

1. **Tray-keeps-stream-alive** matches the user's mental model of "minimized
   tray icon" — minimized apps don't quit. The X button is the explicit
   quit gesture.
2. **Stack-based back** gives the user the natural undo they asked for
   ("back will go back to the webcam") without breaking expected
   slide rewind once they've committed to navigating.
3. **Forward-keys passthrough** captures the intent of "press right
   arrow → slide moves" while leaving Escape free for "exit fullscreen
   without advancing".

If any default is wrong, the user can correct in one sentence and we
adjust — none of these are baked into the spec deeper than 1 file.

## Files

- Spec: `spec/21-slides-system/66-presenter-webcam.md`
- Memory: `mem://features/presenter-webcam-overlay` (updated)
- Implementation: `src/slides/components/usePresenterWebcam.tsx`,
  `src/slides/components/PresenterWebcamOverlay.tsx`,
  `src/slides/components/PresenterWebcamTray.tsx` (new)
- Tests: `src/test/presenterWebcamPhase2.test.tsx` (new),
  `src/test/presenterWebcamClose.test.tsx` (existing guard)
