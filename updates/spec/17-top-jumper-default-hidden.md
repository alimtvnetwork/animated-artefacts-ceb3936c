# 17 — Top jumper default flipped to hidden (code fix)

**Date:** 2026-05-06
**Scope:** `src/pages/SlideDeckPage.tsx` only (1-file change)
**Related spec:** `spec/21-slides-system/65-presenter-shortcuts-v5.md` §2,
`spec/21-slides-system/64-presenter-webcam.md` §"Top Talk Jumper"
**Memory:** `.lovable/memory/features/top-jumper-visibility-toggle.md`

## What was wrong

The spec (§29 requirements, spec 64 §15, spec 65 §2) says **Top Talk
Jumper is hidden by default** — the presenter opts in only when needed.
The code in `SlideDeckPage.tsx` initialised the state from
`localStorage.getItem('riseup.topJumperHidden') === '1'`, which means a
fresh user (no key set) got `false` → chip *visible*. The spec and the
code disagreed; the code lost.

## What changed

Init reader flipped to a **hidden-by-default** contract:

```ts
const stored = window.localStorage.getItem('riseup.topJumperHidden');
return stored !== '0';
```

Storage contract:

| `localStorage` value | Resolved state |
|---|---|
| missing | hidden (new default) |
| `'1'` | hidden (legacy explicit) |
| `'0'` | shown (user opted in) |
| anything else | hidden (defensive) |

The toggle write path is unchanged — it still writes `'1'` (hidden) /
`'0'` (shown), so existing users who had explicitly hidden the chip
keep their choice, and existing users who had explicitly shown it
keep theirs too. Only users who never touched the toggle (the
overwhelming majority) flip from "visible" → "hidden", which is what
the spec asked for.

## Why a write-on-mount migration is **not** done

We could have written `'1'` to localStorage on first load to "lock in"
the new default, but that would silently overwrite the case where a
user clears site data and expects the spec default again. The
read-time resolver above is idempotent and survives clears, so it's
the safer pattern.

## Test

Manual: open a fresh incognito window → top jumper chip is **not**
visible. Press `J` → chip appears. Refresh → chip stays visible
(localStorage now `'0'`). Press `J` again → chip hidden, refresh →
still hidden.

## Files touched

- `src/pages/SlideDeckPage.tsx` — init reader (lines 77–83).
- `.lovable/memory/features/top-jumper-visibility-toggle.md` — default
  + storage contract documented.
- `updates/spec/17-top-jumper-default-hidden.md` — this file.
