# 08 — Jump & Routing

How a slide number on screen connects to the browser URL, and what happens
when the user jumps. Owner: `src/pages/SlideDeckPage.tsx`.

## Route shape

- Flat, 1-segment routes: **`/N`** where `N = slide.slideNumber` (the authored
  id), e.g. `/7`. Read via `useParams()` → `params.slideNumber`.
- The query string is always preserved across navigation (`location.search`),
  so flags such as `?theme=`, `?jumper=1`, `?themeDebug=1` survive jumps.

## Display number vs route number

- **What the user sees** = `currentLinear` (1-based position in the linear
  list). This is what every surface displays.
- **What the URL uses** = the target slide's `slideNumber`.
- The two can differ. Jump handlers therefore translate a clicked/typed
  **linear position** into the target slide's `slideNumber` before navigating.

## The jump pipeline

```text
user clicks dot / types number  →  onJump(n)        n = 1-based linear pos
                                      │
                                      ▼
   jump(n):  target = linearSlides[n-1]
             if target:
               slideSound.play('click')             ← exactly one cue
               goTo(target.slideNumber, dir)
                                      │
                                      ▼
   goTo(num, dir): target = allSlides.find(s => s.slideNumber === num)
                   if !target || target.enabled === false → return (no-op)
                   navigate(`/${num}${location.search}`, { replace:false })
                                      │
                                      ▼
   Router re-renders SlideDeckPage with new params.slideNumber
   → resolvedLinearIdx recomputed → currentLinear updates
   → every surface re-renders with the new number
```

- `dir` (`'forward' | 'backward'`) is `n > linearIdx + 1 ? 'forward' :
  'backward'`. It only chooses the slide transition animation direction.

## Next / Prev (for completeness)

- `next()` and `prev()` also play `slideSound.play('click')` then `goTo(...)`
  to the adjacent linear slide's `slideNumber`. If the current slide is a
  click-reveal child, they first walk back to `slide.parentSlide`.

## Canonical-URL self-heal

After mount, if the resolved slide's `slideNumber` doesn't match the URL, the
page rewrites the URL to the canonical `/{slide.slideNumber}` using
`history.replaceState` (not router `navigate`) so it doesn't add a history
entry. Invalid/missing `/N` falls back to the first linear slide
(`linearSlides[0]?.slideNumber ?? 1`) with `replace: true`.

## History entries

- Jumps and next/prev use `navigate(..., { replace: false })` → each is a new
  browser history entry, so **back/forward step through visited slides**.

## `document.title`

- The **live deck does NOT currently sync `document.title`** to the slide
  number (only `HandoutPage` and `PreviewDiagnosticsPage` set a title).
- Screen-reader users still get the change via the `aria-live` regions on the
  top bar / badge and the page-level announcement
  `Slide ${currentLinear} of ${total}: ${title}`.
- *Optional enhancement (not yet implemented):* set
  `document.title = \`${currentLinear}/${total} — ${slide.content.title}\``
  on slide change. If you add this, do it in `SlideDeckPage` only.

## BroadcastChannel sync

- Presenter/audience windows sync via a channel; a `jump` message calls
  `h.goTo(msg.n, msg.n > h.current ? 'forward' : 'backward')`. Keep jump
  semantics identical across windows.
