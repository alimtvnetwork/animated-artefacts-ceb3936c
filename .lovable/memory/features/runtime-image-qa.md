---
name: runtime-image-qa
description: v0.162 — `runRuntimeImageQA()` fetches every entry in REFERENCE_ASSETS via the live browser network stack, decodes via `<img>.decode()`, compares decoded dims to the manifest, and surfaces failures via a top-right `<RuntimeImageQAOverlay>`. Triggered by `?qa=images` flag (always) or auto on `/style-guide` in dev.
type: feature
---
v0.162.0.

# Why
Build-time test asserts disk + IHDR dims; CI audit asserts header format/size/duration; boot loader HEADs `deck.assets.*`. None of those catch a CDN serving truncated bytes, a stale ServiceWorker, or an image-proxy returning the wrong format under a 200 OK. Spec 54 is the missing browser-side layer.

# Statuses
- `ok` — 2xx, decode resolved, dims match.
- `not-found` — non-2xx HTTP or fetch rejected.
- `decode-failed` — 2xx response, but `img.decode()` rejected (corrupt PNG, wrong magic bytes).
- `dimension-mismatch` — decoded fine, but `naturalWidth × naturalHeight` ≠ manifest.

# Probing strategy
`fetch(url, { cache: 'reload' })` → blob URL → `<img>.decode()` → compare dims. Cache reload busts ServiceWorker so re-runs read live deployment. Blob URL ensures decode sees the same bytes the network just delivered (no second HTTP round trip, no `img.src=…` race). 6 in-flight worker cap.

# Triggers
- `?qa=images` URL flag (always) — manual one-shot for deploy verification.
- `/style-guide` in `import.meta.env.DEV` only (auto) — dev iterating on the gallery surface.
- Runs post-mount inside `requestIdleCallback`. Boot never blocks on it. Errors swallowed.

# Overlay
`<RuntimeImageQAOverlay>` mounted globally in `App.tsx`. Renders nothing unless ≥1 non-`ok` result. Inline-styled (not Tailwind) so it paints even if layout system fails. Dismissable for session. `role="alert"` + `aria-live="polite"`.

# Files
- `src/slides/runtimeImageQA.ts` — module
- `src/slides/components/RuntimeImageQAOverlay.tsx` — overlay
- `src/App.tsx` — overlay mounted
- `src/main.tsx` — trigger + idle-deferred fire
- `spec/slides/54-runtime-image-qa.md` — full spec
- `package.json` — 0.162.0
