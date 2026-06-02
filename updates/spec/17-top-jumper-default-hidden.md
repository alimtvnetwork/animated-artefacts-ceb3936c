# 17 — Top jumper default flipped to hidden (code fix)

**Date:** 2026-05-06
**Scope:** `src/pages/SlideDeckPage.tsx` only (1-file change)
**Related spec:** `spec/21-slides-system/65-presenter-shortcuts-v5.md` §2,
`spec/21-slides-system/66-presenter-webcam.md` §"Top Talk Jumper"
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

## One-time migration (second pass, 2026-05-06)

The first pass argued *against* a migration. Field feedback overruled
that: testers who had previously opted the chip ON kept seeing it after
the default flip because their stored `'0'` survived a deploy. The user
explicitly asked for "hidden by default" to actually take effect on
existing browsers.

We now run a **one-shot reset** inside the `useState` initialiser,
gated by a separate marker key so it cannot run twice:

```ts
const migrated = localStorage.getItem('riseup.topJumperHidden.migrated.v1');
if (migrated !== '1') {
  localStorage.removeItem('riseup.topJumperHidden');
  localStorage.setItem('riseup.topJumperHidden.migrated.v1', '1');
}
```

After the reset, any subsequent `J` press writes `'0'` again and the
marker prevents further migrations — intentional opt-ins survive page
reloads. Clearing site data resets both keys and the spec default
re-applies on the next visit, which is the desired behaviour.

## Test

Automated: `src/test/topJumperDefaultHidden.test.ts` covers the
initialiser contract (default hidden, `'1'` hidden, `'0'` shown,
garbage/empty hidden, SSR hidden), the migration semantics
(legacy `'0'` is reset on first load when the marker is absent;
preserved when the marker is present), the write-path mapping, and
spec parity (shortcuts v5 + memory feature note).

Manual: in an existing browser with `riseup.topJumperHidden='0'`
already set, refresh `/12` → chip is now **hidden** and the marker
key is set. Press `J` → chip appears, `riseup.topJumperHidden='0'`
again. Refresh → chip stays visible (migration does not re-run).

## Files touched

- `src/pages/SlideDeckPage.tsx` — init reader + one-shot migration (lines 77–98).
- `src/test/topJumperDefaultHidden.test.ts` — new regression suite.
- `.lovable/memory/features/top-jumper-visibility-toggle.md` — default
  + storage contract + migration documented.
- `updates/spec/17-top-jumper-default-hidden.md` — this file.
