# Presenter View

The presenter view is a second-window companion to the live deck. Open it from
the controller pill (monitor icon) or by visiting `/present` directly. It is
designed for the presenter's laptop screen while the audience sees the deck on
an external display.

## Layout

```
┌────────────────────────────────────────────────────────────────┐
│  PRESENTER · Riseup Asia 2026 Deck             ⏱ 00:12:45   2/4│
├────────────────────────────────────────┬───────────────────────┤
│                                        │  NEXT UP              │
│                                        │  ┌──────────────┐     │
│         Current slide preview          │  │ next slide   │     │
│         (pixel-accurate)               │  │ thumbnail    │     │
│                                        │  └──────────────┘     │
│                                        │                       │
│              ◀  Next ▶                 │  SPEAKER NOTES        │
│                                        │  ……………………………………       │
└────────────────────────────────────────┴───────────────────────┘
```

## Sync

Sync uses `BroadcastChannel('riseup-deck-sync')`:

- Deck → Presenter: `{ type: 'slide', n }` on every navigation.
- Deck → Presenter: `{ type: 'theme', id }` on every theme switch — the
  presenter window calls `applyTheme(id)` so its chrome (chips, timer pill,
  gold accents, ring around the current-slide preview) tracks the audience
  colors live.
- Presenter → Deck: `{ type: 'nav', dir: 'next' | 'prev' }` or
  `{ type: 'nav', dir: 'jump', n }`.

The presenter view also calls `applyTheme(getStoredTheme())` on mount so it
matches the audience deck even when opened in a separate browser process or
after a hard refresh.

### Channel-stability rule (important)

The deck window MUST create the BroadcastChannel **once on mount** and keep it
open for the life of the page. Handlers that depend on changing state
(`current`, `next`, `prev`, …) must be read from a `ref` inside the message
listener — they must NOT live in the effect's dependency array. Re-creating
the channel on every state change closes and re-opens it, which silently drops
in-flight `nav` messages from the presenter window. Symptom: presenter buttons
appear to do nothing.

Browsers without `BroadcastChannel` (very old) just fall back to a static
presenter view that doesn't drive the deck and won't track theme switches.

## Speaker notes

Add a top-level `notes` string to any slide JSON:

```json
{
  "slideNumber": 2,
  "slideName": "capabilities",
  "notes": "Lead with the founder's pain point. Pause after 'systems'.\n\nOptional: mention the Tokyo case study if the audience leans enterprise.",
  "...": "..."
}
```

Notes are presenter-only — they never appear in the audience view, the URL, or
the share menu. Newlines render as paragraph breaks.

## Timer

Starts when the presenter window opens. Click the rotate icon next to the
clock to reset to `00:00:00`. The timer is local to the presenter window — it
does not sync.

## Keyboard shortcuts

| Key                | Action          |
|--------------------|-----------------|
| `→` / `Space` / `Enter` | Next slide |
| `←` / `Backspace`  | Previous slide  |

These commands are broadcast to the deck window via the channel above, so the
audience display advances in lockstep.
