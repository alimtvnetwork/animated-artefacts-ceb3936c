---
name: asset-preload
description: Boot-time preloader eagerly loads ALL bundled images + every URL referenced anywhere in the deck/slide tree (deep walk) + audio
type: feature
---

# Asset preloader — eager + deep walk (v0.153.1)

`src/slides/preload.ts` no longer cherry-picks. At boot:

1. **Synchronous priority batch:** brand chrome (logo + presenter avatar)
   + first slide's QR + first slide's image. Injected before paint.
2. **Deferred batch (idle / 200ms fallback):**
   - **Every** bundled image under `src/assets/**/*.{png,jpg,jpeg,svg,webp,gif,avif}` — preloaded as `image`.
   - **Every** bundled audio file (`.mp3/.wav/.ogg/.m4a`) — preloaded as `audio` via opaque `fetch(..., {cache:'force-cache'})`.
   - **Every URL string** discovered by a recursive walk over the deck spec
     and each slide's `content` (catches nested `contactRows`, `capsules`,
     `image`, `audio`, hero blocks, future custom slide types — anything
     that looks like `http(s)://…`, `/…`, or has an asset extension).

Idempotent: a module-level `INJECTED` Set guards against duplicate `<link>` tags.

Why eager: the contact slide's QR (and other late-slide assets) used to
pop in the first time the user navigated to slide 6. The cherry-pick logic
only knew about `content.image` and `content.qrAsset` — it missed every
nested URL and every bundled-but-unreferenced-by-typed-fields asset.
