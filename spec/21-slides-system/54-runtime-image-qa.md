# Spec 54 — Runtime image QA (v0.162)

## Why
The reference-image manifest at `src/slides/referenceAssetsManifest.ts`
already drives a **build-time** Node test (`src/test/referenceAssets.test.tsx`)
that asserts every PNG exists on disk and decodes to the locked dimensions.
That test runs in jsdom against the filesystem — it cannot catch:

- A CDN that serves a truncated body (200 OK + corrupt bytes).
- A Cloudflare image-proxy mid-flight transformation that returns a WebP
  when the manifest expects PNG.
- A Service Worker holding a stale copy across deploys.
- A redirect that swaps the asset for a placeholder.
- A correct file at a wrong path because of a CDN base-URL regression.

Spec 54 closes that gap with a **browser-side audit** that fetches every
manifest entry through the live network stack, decodes via `<img>.decode()`,
and compares the decoded `naturalWidth × naturalHeight` to the manifest.

## Module — `src/slides/runtimeImageQA.ts`

```ts
import { runRuntimeImageQA, logRuntimeImageQAReport } from '@/slides/runtimeImageQA';

const report = await runRuntimeImageQA();
logRuntimeImageQAReport(report);
```

### Result statuses

| Status | Cause | What to fix |
|---|---|---|
| `ok` | 2xx response, decode resolved, dimensions match | — |
| `not-found` | Non-2xx HTTP, or fetch rejected (network / CORS / offline) | Restore the file or fix the path. |
| `decode-failed` | 2xx response, but `img.decode()` rejected | The file is corrupt or the wrong format — re-export. |
| `dimension-mismatch` | Decoded fine, but `naturalWidth × naturalHeight` ≠ manifest | Re-export at the locked size **or** update the manifest entry (and the matching `whyLocked` rationale). |

### Probing strategy

1. `fetch(url, { cache: 'reload' })` — bust ServiceWorker / disk cache so
   re-runs see the live deployment, not yesterday's bytes.
2. Non-2xx → `not-found` with `httpStatus`.
3. Otherwise → blob URL → `<img>.decode()`. Using a blob URL guarantees
   `decode()` sees the same bytes the network just delivered (avoids a
   second HTTP round trip and an `img.src=…` race).
4. Compare dims; build `ImageQAResult`.

Concurrency cap: 6 in-flight (matches Chrome's per-origin HTTP/1 budget).
Wall time on localhost: ~80–250ms for the current 9-asset manifest.

### Subscription API

```ts
const unsubscribe = subscribeRuntimeImageQA((report) => { /* re-render */ });
```

Used by `<RuntimeImageQAOverlay>` to surface failures without polling.

## Overlay — `src/slides/components/RuntimeImageQAOverlay.tsx`

Mounted globally in `App.tsx`. Renders nothing unless the latest report
contains ≥1 non-`ok` result. Top-right card listing `[status] path`,
`detail`, and `whyLocked` for each failure. Dismissable for the session.

Inline-styled (not Tailwind) so it paints identically even if the layout
system fails — this is a diagnostic surface, it must work when the rest
of the app doesn't.

## Triggers (wired in `main.tsx`)

| Trigger | When | Audience |
|---|---|---|
| `?qa=images` URL flag | Always | Anyone running a manual deploy verification |
| `/style-guide` in dev | Auto | Dev iterating on the gallery surface |

The QA loop runs **after** `createRoot().render(<App/>)` and inside
`requestIdleCallback` (200–400ms timeout fallback). Boot is never blocked
on it. Errors inside the loop are swallowed — a QA failure must not
cascade into a broken app.

## Layered audit map

| Layer | What | When | Where |
|---|---|---|---|
| `referenceAssets.test.tsx` | fs existence + IHDR width/height | Vitest in CI | Node + jsdom |
| `audit-asset-resolutions.ts` | header-parse format/dim/duration/size for `deck.assets.*` | `bun run audit:resolutions` (CI) | Bun |
| `assertDeclaredAssetFiles` | HTTP HEAD on every `deck.assets.*` URL | Boot, blocks render | Browser |
| **`runRuntimeImageQA`** | **fetch + decode + dim-check `REFERENCE_ASSETS`** | **Post-mount, opt-in** | **Browser** |

## Caveats

- **CORS:** The reference assets are served from the same origin as the
  app, so cross-origin restrictions don't apply. If a future asset moves
  to a third-party CDN without CORS headers, `img.decode()` will succeed
  but `naturalWidth` may read 0 in some browsers — surface as
  `dimension-mismatch` (the existing branch already handles 0×0).
- **Reduced motion / accessibility:** The overlay uses `role="alert"` +
  `aria-live="polite"` so screen readers announce failures without
  interrupting the user.
- **Production posture:** The dev-only auto-run on `/style-guide` does
  NOT run in production. Production users must explicitly request the
  audit with `?qa=images`. This avoids surprise network burst on a CDN
  for a real audience.

## Files

- `src/slides/runtimeImageQA.ts` — new
- `src/slides/components/RuntimeImageQAOverlay.tsx` — new
- `src/App.tsx` — overlay mounted at root
- `src/main.tsx` — trigger wiring (post-mount, idle-deferred)
- `package.json` — 0.162.0
