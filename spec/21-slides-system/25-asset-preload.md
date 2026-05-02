# 25 — Asset Preloader

Preload heavy slide assets (QR images, presenter avatar, brand logos,
slide hero images) at app boot so navigating to a later slide never
shows an image-pop. Eliminates the latency the user noticed on the
contact / QR slide.

## 1. What gets preloaded

For every slide in the active deck, the loader scans for:

- `spec.qrAsset` (resolves to `/assets/brand/<asset>.png` etc.)
- `spec.content.image?.src` and `image.srcDark`
- Imported brand assets used by `BrandHeader` and `BrandStrip`
  (logo, presenter avatar) — these are static so we preload once.

The loader resolves each path to the bundled URL via Vite's
`import.meta.glob('@/assets/**/*.{png,jpg,jpeg,svg,webp}', { eager: true, as: 'url' })`
or via the existing `meeting.ts` resolver.

## 2. Implementation

`src/slides/preload.ts` (new):

```ts
export function preloadDeckAssets(deck: DeckSpec, slides: SlideSpec[]) {
  const urls = collectAssetUrls(deck, slides);
  // Use <link rel="preload" as="image"> for browser priority handling.
  for (const url of urls) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  }
  // Also kick a real Image() so the cache warms even if the browser
  // ignores the preload hint for some reason.
  for (const url of urls) {
    const img = new Image();
    img.src = url;
  }
}
```

Called once from `src/main.tsx` after the deck loader resolves.

## 3. Priority order

1. **First-paint critical** (slide 1 + brand assets) — issued
   synchronously on boot.
2. **Adjacent slides** (current ± 2) — issued after first paint via
   `requestIdleCallback`.
3. **Rest of deck** — issued via `requestIdleCallback` with a 200ms
   delay between batches so we don't saturate the network.

For the v0 implementation, batch 1 + 2 are merged (just preload all
at boot — typical decks are <30 slides and <5MB total).

## 4. No layout impact

Preloading uses `<link rel="preload">` and warm `Image()` objects. It
does NOT mount any visual element, so layout, scroll, and animation
state are untouched.
