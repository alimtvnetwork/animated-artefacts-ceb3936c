# Spec 36 — StepTimeline First-Load Quiet + Header-Aligned Body

Status: locked (v0.68.0)
Related: spec 23 (StepTimeline v3), spec 27 (v3.2 typography), spec 33 (interaction layer), spec 34 (body grid alignment), spec 35 (alignment guide).

## Root cause analysis

Slide 3 starts the step cursor at `active = -1` while the reveal sequence plays. During that pre-reveal phase the UI still renders Step 1 as the visual focus by using `displayActive = 0` / `referenceIdx = 0`.

After the reveal timer completes, React sets `active = 0`. That produced two bad effects:

1. Step 1 looked active on load, then its keyed active text and badge mounted again, replaying `step-text-slide`, `step-badge-bubble`, and `step-badge-radiate` as if the presenter had intentionally selected it.
2. The sound effect watched every `active` change, so the first `-1 → 0` handoff played the focus whoosh even though the first item was already visually established.

The visual result was a double-fire: Step 1 loaded, then immediately animated/sounded again.

## Decision

Use the quieter approach, not the all-blurred approach.

- On first slide load, Step 1 may appear as the initial focus.
- The first `active = 0` handoff MUST NOT replay Step 1's activation animation.
- The first `active = 0` handoff MUST NOT play the focus sound.
- Moving to Step 2, Step 3, etc. MUST still play the normal animation and sound.
- Returning to Step 1 later MUST play the normal animation and sound.

This preserves a clean initial composition and avoids an artificial blurred loading state.

## Implementation rules

### 1. Initial Step 1 animation guard

`StepTimelineSlide.tsx` tracks whether the cursor has ever left the initial step:

```ts
const [hasLeftInitialStep, setHasLeftInitialStep] = useState(false);

useEffect(() => {
  if (active > 0) setHasLeftInitialStep(true);
}, [active]);
```

The Step 1 active keyed nodes only get activation animation classes after that flag is true:

- no `step-text-slide` on first `active=0`
- no `step-badge-bubble` / initial radiate-trigger remount on first `active=0`
- normal classes return after any later `active > 0 → 0` navigation

### 2. Initial Step 1 sound guard

The focus sound effect skips only the first `active === 0` arrival:

```ts
if (active === 0 && !skippedInitialFocusSound.current) {
  skippedInitialFocusSound.current = true;
  lastPlayedActive.current = active;
  return;
}
```

All later active changes use the existing `spec.sound` rules.

### 3. Ubuntu step headers

Step row titles are deck headers, not body text. They MUST use Ubuntu Bold:

```css
.step-row .step-title {
  font-family: 'Ubuntu', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 700;
}
```

The previous Poppins override is retired. `spec/slides/27-step-timeline-v3.2.md` is superseded for typography only; fixed-slot rows and pure-white text behavior still stand.

### 4. Header-anchored body grid default

The repeated alignment issue came from the centered 75% body container. On the user's Slide 3 viewport, the logo sits near the viewport edge while the body grid starts much farther right.

Default behavior is now header-anchored:

```css
--body-grid-margin-left: clamp(1.5rem, 2vw, 2rem);
--body-grid-margin-right: auto;
```

`bodyAlignment` remains available in `/settings`, but its default is `header-anchored`. Users can still select `centered` when they explicitly want the old large-screen centered composition.

The `max-width: 1440px` cap stays intact in both modes.

## Verification checklist

1. Load `/3` fresh: Step 1 is visible, but it does not replay active text/badge animation after the reveal completes.
2. Load `/3` fresh: no first Step 1 whoosh plays from the `active=-1 → 0` handoff.
3. Move to Step 2: animation and whoosh play normally.
4. Move back to Step 1: animation and whoosh play normally.
5. Step titles (`Discovery`, `Strategy`, `Build`, `Scale`) render in Ubuntu Bold.
6. With default settings, the body grid left edge aligns with the RiseupAsia logo line.
7. Enable the alignment guide: logo.x and body.x should match within ±1px in default/header-anchored mode.
