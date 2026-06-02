# Issue 63 (scoping) — Consolidate presenter webcam to a single `<video>` via portal

Date: 2026-06-02 (Malaysia UTC+8)
Source of truth: `src/slides/components/PresenterWebcamOverlay.tsx`

## Symptom / motivation

`PresenterWebcamOverlay` currently renders **8 `<video>` elements** (inline pill,
fullscreen, stage-fill, circle/rect variants, etc.), all bound to the *same*
`MediaStream`. The rebind loop in the overlay already feeds the stream onto
`[videoRef, fullscreenVideoRef]` and siblings. Costs:

- Each `<video>` is an independent decode surface — several decoders fed by one
  stream is wasteful on lower-end machines and can desync frames between
  surfaces during phase transitions.
- Phase changes (`off · requesting · on · tray · fullscreen · stage`) mount /
  unmount video nodes, briefly dropping the bound surface and causing a flash.
- Shape cycling (`O`: rect → circle → circle+glow) and the cinematic cycle
  (`]`) animate container geometry while the video lives inside — the transform
  envelope is duplicated per surface.

## Proposed refactor (deferred — large)

Render exactly **one** `<video>` node, owned by `usePresenterWebcam`, and move
it between target containers with `ReactDOM.createPortal`:

```text
usePresenterWebcam
  └─ owns the single <video> (srcObject bound once, never re-mounted)
       └─ portal target = activeSurfaceRef (pill | fullscreen | stage)
            ↑ surfaces register their container ref; phase change repoints portal
```

- Surfaces become **empty positioned containers** that register a ref.
- Phase / shape changes repoint the portal target — the `<video>` node and its
  decode pipeline persist, so no flash, no desync, one decoder.
- Geometry/shape transforms apply to the container; the inner `<video>` keeps
  `object-fit: cover` + autoFrame transform unchanged.

## Decision

**Deferred.** This touches an 1300+ line component on the critical presenter
path with subtle WAAPI / spring + autoFrame transform coupling and reduced-motion
branches. The current multi-`<video>` approach is functionally correct (single
stream, correct binding). Refactor only when:

1. A measured perf/desync complaint exists on target hardware, **and**
2. We can land it behind the existing webcam regression suite
   (`presenterWebcamClose`, `presenterWebcamHaloAndStage`,
   `presenterWebcamCinematicCycle`) plus a new portal-reparent test.

## Prevention / interim rule

Until the portal refactor lands, any NEW webcam surface MUST be added to the
stream-rebind loop (currently `[videoRef.current, fullscreenVideoRef.current]`)
so it receives `srcObject`. A surface that forgets the rebind shows a black box.
Do not add a sixth bespoke `<video>` without updating that loop.
EOF
echo done