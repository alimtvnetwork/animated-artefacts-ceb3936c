---
name: presenter-sync
description: BroadcastChannel rules between deck and presenter view; channel-stability bug
type: feature
---

## Sync model

- Channel: `BroadcastChannel('riseup-deck-sync')`
- Deck → Presenter: `{ type: 'slide', n }` on every navigation
- Presenter → Deck: `{ type: 'nav', dir: 'next' | 'prev' }` or `{ type: 'nav', dir: 'jump', n }`

## Channel-stability rule (CRITICAL — caused the "presenter buttons do nothing" bug)

The deck window MUST create the BroadcastChannel **once on mount** with an empty deps array. Handlers (`next`, `prev`, `goTo`, `current`) change every render — putting them in the effect's deps closes and re-opens the channel constantly, dropping the presenter's `nav` messages.

Pattern:

```tsx
const channelRef = useRef<BroadcastChannel | null>(null);
const handlersRef = useRef({ next, prev, goTo, current });
useEffect(() => { handlersRef.current = { next, prev, goTo, current }; });

useEffect(() => {
  const ch = getChannel();
  channelRef.current = ch;
  if (!ch) return;
  function onMsg(e) {
    const h = handlersRef.current; // read fresh on each message
    // ... dispatch
  }
  ch.addEventListener('message', onMsg);
  return () => { ch.removeEventListener('message', onMsg); ch.close(); };
}, []); // ← empty, mount once
```

Same rule applies to any future BroadcastChannel/WebSocket/EventSource integration in the deck.
