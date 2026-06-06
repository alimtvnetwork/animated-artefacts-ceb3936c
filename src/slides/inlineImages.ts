/**
 * Base64 image inlining for self-contained, one-file deck export.
 *
 * The default manifest export references images by path (e.g.
 * `/assets/team.jpg`) — portable only if those files exist in the
 * destination project. This module walks a deck/slide payload, fetches every
 * path-referenced raster/SVG image, and rewrites it as a Base64 `data:` URI
 * so the resulting JSON is **fully self-contained**: one file carries the
 * slides AND their images. Inline SVG markup (`<svg…>`) and existing
 * `data:` URIs are left untouched.
 *
 * Only the `image` (string) and `images` (string[]) fields are inlined —
 * these are the author-facing image slots described in the image-authoring
 * contract (`spec/21-slides-system/images/01-image-authoring.md`), including
 * per-step thumbnails (`steps[].image`).
 */

/** True for values that are already embedded and must not be re-fetched. */
function isAlreadyEmbedded(value: string): boolean {
  const v = value.trim();
  return v.startsWith('data:') || v.startsWith('<svg') || v.startsWith('<?xml');
}

/** True for strings that look like an image reference we can fetch. */
function isFetchableImage(value: string): boolean {
  const v = value.trim();
  if (!v || isAlreadyEmbedded(v)) return false;
  return v.startsWith('/') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('./') || /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(v);
}

/** Fetch one image URL and return a Base64 `data:` URI, or null on failure. */
async function fetchAsDataUri(url: string): Promise<string | null> {
  try {
    const abs = url.startsWith('http') ? url : new URL(url, window.location.origin).toString();
    const res = await fetch(abs);
    if (!res.ok) {
      console.warn(`[inlineImages] Skipped ${url} — HTTP ${res.status}`);
      return null;
    }
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`[inlineImages] Failed to inline ${url}`, err);
    return null;
  }
}

/**
 * Deep-clone `payload` and replace every fetchable `image` / `images`
 * reference with a Base64 data URI. Returns the count of images inlined.
 * Mutates the returned clone, never the input.
 */
export async function inlineImagePayload<T>(payload: T): Promise<{ payload: T; inlined: number }> {
  const clone = structuredClone(payload) as T;
  const cache = new Map<string, string | null>();
  let inlined = 0;

  async function resolve(url: string): Promise<string | null> {
    if (!cache.has(url)) cache.set(url, await fetchAsDataUri(url));
    return cache.get(url) ?? null;
  }

  async function walk(node: unknown): Promise<void> {
    if (Array.isArray(node)) {
      for (const item of node) await walk(item);
      return;
    }
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'image' && typeof value === 'string' && isFetchableImage(value)) {
        const uri = await resolve(value);
        if (uri) { obj[key] = uri; inlined++; }
      } else if (key === 'images' && Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const entry = value[i];
          if (typeof entry === 'string' && isFetchableImage(entry)) {
            const uri = await resolve(entry);
            if (uri) { value[i] = uri; inlined++; }
          }
        }
      } else {
        await walk(value);
      }
    }
  }

  await walk(clone);
  return { payload: clone, inlined };
}
