---
name: SyncMessage strongly-typed handler utility
description: Exhaustive discriminated-union dispatcher (`handleSyncMessage`) + runtime guard (`isSyncMessage`) for the BroadcastChannel protocol shared by SlideDeckPage ↔ PresenterPage
type: feature
---

# SyncMessage handler utility (v0.184)

`src/slides/sync.ts` owns the BroadcastChannel wire format `SyncMessage`
(union of `slide` / `nav{next|prev|jump}` / `request-state` / `theme`) and now
also owns three pieces of TS leverage that make the protocol safe to evolve:

1. **`SyncMessageHandlers<R = void>`** — mapped object type keyed by
   `SyncMessage['type']`. Adding a new variant (e.g. `'pointer'`) immediately
   fails the build at every call site that constructs a handler literal.
2. **`handleSyncMessage(msg, handlers)`** — switch-based dispatcher with an
   internal `assertNever(_: never)` guard. Drop a `case` and TS widens past
   `never`; add a runtime payload with an unknown discriminant and the
   thrown `Error` surfaces it (path covered by `syncMessage.test.ts`).
3. **`isSyncMessage(value: unknown): value is SyncMessage`** — runtime type
   guard. `MessageEvent.data` is honestly `unknown` (cross-tab, devtools,
   future protocol drift can deliver anything), so both pages call this
   before the dispatcher.

## Call-site contract

Both pages MUST handle every variant explicitly, even with `() => {}`. The
no-op handlers carry comments explaining intent so the next reader doesn't
"clean them up":

- **SlideDeckPage** owns navigation authority → no-ops inbound `slide`
  (own echo) and `theme` (ThemePicker emits + applies directly). Drives
  `next`/`prev`/`jump` from `nav`; answers `request-state` with a fresh
  `slide` snapshot from `handlersRef.current`.
- **PresenterPage** mirrors the deck → no-ops `nav` (would feedback-loop)
  and `request-state` (only the live deck answers). Sets local `current`
  on `slide`; re-applies theme on `theme`.

## When to extend

Adding a new variant is a 4-step ritual — TS will guide you through it:

1. Add the new union arm to `SyncMessage`.
2. Extend `isSyncMessage`'s `switch` with the runtime shape check.
3. Build now fails at both pages → add the handler literal entry. If a
   page should ignore it, write `noop: () => {}` with a one-line comment
   explaining why ignoring is correct (not "TODO").
4. Add a test row to `src/test/syncMessage.test.ts` `isSyncMessage` and
   `handleSyncMessage` blocks.

## Forbidden

- Don't go back to `if (msg.type === ...) ... else if ...` ladders — that's
  exactly the silent-no-op surface this utility eliminates.
- Don't widen handler return types to `void` at call sites that need a
  value back. The dispatcher is generic in `R`; use it.
- Don't bypass `isSyncMessage` and trust `MessageEvent<SyncMessage>`. Other
  windows can post anything to the channel name.

## Related

- `src/slides/sync.ts` — utility + guard + dispatcher
- `src/pages/SlideDeckPage.tsx` — deck-side handler literal
- `src/pages/PresenterPage.tsx` — presenter-side handler literal
- `src/test/syncMessage.test.ts` — 6 tests covering routing, exhaustiveness,
  guard rejection, and the integration pattern
