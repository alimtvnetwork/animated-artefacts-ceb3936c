/**
 * Lightweight presenter ↔ deck sync over BroadcastChannel.
 *
 * - The deck (SlideDeckPage) posts every slide change as { type: 'slide', n }.
 * - The presenter (PresenterPage) listens and mirrors the current slide.
 * - The presenter can also drive the deck via { type: 'nav', dir: 'next' | 'prev' | 'jump', n? }.
 *
 * Falls back gracefully when BroadcastChannel is unavailable (older browsers).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * v0.183 — strongly-typed exhaustive handler utility
 * ─────────────────────────────────────────────────────────────────────────────
 * Pages historically did `if (msg.type === 'slide') ... else if (msg.type === ...)`
 * chains. Under `strict: true` this works, but it does NOT fail the build when
 * a new `SyncMessage` variant is added — the dropped case just silently no-ops.
 *
 * `handleSyncMessage` below replaces those chains with a discriminated-union
 * lookup table keyed by `SyncMessage['type']`. Because the table is typed as a
 * mapped object over the union's discriminant, adding a new variant to
 * `SyncMessage` immediately produces a `Property '<new-type>' is missing in
 * type 'SyncMessageHandlers'` error at every call site. The internal
 * `assertNever` fallback also catches accidentally-removed cases and any data
 * that slips past the runtime guard with an unknown `type`.
 *
 * For variants whose narrowing requires a secondary discriminant (`nav.dir`),
 * the handler receives the fully-narrowed message — `handlers.nav` sees
 * `{ type: 'nav'; dir: 'next' | 'prev' } | { type: 'nav'; dir: 'jump'; n: number }`
 * so a nested switch on `msg.dir` stays exhaustive too.
 */
const CHANNEL = 'riseup-deck-sync';

/**
 * Wire format for every BroadcastChannel message in the app.
 *
 * Discriminated by `type`. Some variants (`nav`) carry a secondary
 * discriminant (`dir`) which further narrows the payload shape.
 */
export type SyncMessage =
  | { type: 'slide'; n: number }
  | { type: 'nav'; dir: 'next' | 'prev' }
  | { type: 'nav'; dir: 'jump'; n: number }
  /** Presenter asks the live deck to broadcast its current state without changing slides. */
  | { type: 'request-state' }
  /** Broadcast when the active theme changes so other windows (presenter) re-apply it. */
  | { type: 'theme'; id: string };

/** Discriminant set extracted from {@link SyncMessage}. Used to key handler maps. */
export type SyncMessageType = SyncMessage['type'];

/**
 * Extract the message variants for a given discriminant value. Equivalent to
 * `Extract<SyncMessage, { type: T }>` but spelled out for readability.
 */
export type SyncMessageOf<T extends SyncMessageType> = Extract<SyncMessage, { type: T }>;

/**
 * Exhaustive handler map. The TypeScript compiler enforces that every member
 * of {@link SyncMessageType} has a corresponding handler — drop one and the
 * build breaks.
 *
 * Each handler receives the fully-narrowed payload for its variant, so
 * `handlers.slide` sees `{ type: 'slide'; n: number }` and `handlers.nav` sees
 * the full `nav` sub-union ready for a nested switch on `dir`.
 *
 * @template R Return type of each handler. Defaults to `void`; use `boolean`
 *   (or another type) when you want the dispatcher's return value to mean
 *   something at the call site.
 */
export type SyncMessageHandlers<R = void> = {
  [K in SyncMessageType]: (msg: SyncMessageOf<K>) => R;
};

/**
 * Internal exhaustiveness guard. If a new variant is added to
 * {@link SyncMessage} but not to a handler map / switch, TypeScript will
 * widen the value flowing into `assertNever` from `never` to the missing
 * variant and fail the build. At runtime it's a no-op for unknown types.
 */
function assertNever(_msg: never): void {
  /* unreachable under strict types; runtime no-op for forward-compat */
}

/**
 * Type guard for raw `MessageEvent.data` payloads. Channels can in principle
 * receive anything (other tabs, devtools, malformed messages), so before we
 * narrow with the handler map we confirm the payload at least *looks* like a
 * {@link SyncMessage} with a known discriminant.
 */
export function isSyncMessage(value: unknown): value is SyncMessage {
  if (typeof value !== 'object' || value === null) return false;
  const type = (value as { type?: unknown }).type;
  if (typeof type !== 'string') return false;
  switch (type as SyncMessageType) {
    case 'slide':
      return typeof (value as { n?: unknown }).n === 'number';
    case 'nav': {
      const dir = (value as { dir?: unknown }).dir;
      if (dir === 'next' || dir === 'prev') return true;
      if (dir === 'jump') return typeof (value as { n?: unknown }).n === 'number';
      return false;
    }
    case 'request-state':
      return true;
    case 'theme':
      return typeof (value as { id?: unknown }).id === 'string';
    default:
      // Unknown discriminant — reject. (No `assertNever` here: at runtime we
      // really can receive arbitrary strings and must just say "no".)
      return false;
  }
}

/**
 * Dispatch a {@link SyncMessage} to its matching handler.
 *
 * Replaces hand-rolled `if (msg.type === ...)` ladders with a single typed
 * lookup. Adding a new {@link SyncMessage} variant forces every call site to
 * provide a handler (or compile-error) — that's the whole point.
 *
 * @example
 * ```ts
 * function onMsg(e: MessageEvent<unknown>) {
 *   if (!isSyncMessage(e.data)) return;
 *   handleSyncMessage(e.data, {
 *     slide: ({ n }) => setCurrent(n),
 *     nav: (m) => {
 *       if (m.dir === 'next') next();
 *       else if (m.dir === 'prev') prev();
 *       else goTo(m.n); // m.dir === 'jump' here, m.n is `number`
 *     },
 *     'request-state': () => channel.postMessage({ type: 'slide', n: current }),
 *     theme: ({ id }) => applyTheme(coerceThemeId(id)),
 *   });
 * }
 * ```
 *
 * @returns Whatever the matched handler returns. When `R` is `void` the
 *   return value can be ignored; when `R` is e.g. `boolean` callers can use
 *   it to decide whether to stop propagation.
 */
export function handleSyncMessage<R>(msg: SyncMessage, handlers: SyncMessageHandlers<R>): R {
  switch (msg.type) {
    case 'slide':
      return handlers.slide(msg);
    case 'nav':
      // `msg` here is the full `nav` sub-union; the handler narrows on `dir`.
      return handlers.nav(msg);
    case 'request-state':
      return handlers['request-state'](msg);
    case 'theme':
      return handlers.theme(msg);
    default:
      // Compile-time exhaustiveness: a new `SyncMessage` variant without a
      // matching `case` will widen `msg` past `never` and fail the build.
      assertNever(msg);
      // Unreachable, but every code path needs an `R` for the compiler.
      throw new Error(`Unhandled SyncMessage type: ${(msg as { type: string }).type}`);
  }
}

export function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(CHANNEL);
}
