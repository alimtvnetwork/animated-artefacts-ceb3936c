/**
 * Deck-wide export module — v0.123.
 *
 * Provides one-click exporters for the entire deck across four formats:
 *
 *   - **PDF (RGB)**       — opens `/handout?print=1` in a new tab. Browser's
 *                           native print engine paginates the deck (one slide
 *                           per A4 landscape page) and offers "Save as PDF".
 *                           Animations are frozen on their final state via
 *                           `data-export-mode="true"` + the `@media print`
 *                           CSS in `index.css`.
 *
 *   - **PDF (CMYK)**      — same flow, plus `?cmyk=1` which applies a CSS
 *                           color filter mapping the screen-RGB palette into
 *                           a CMYK-safe gamut (gold/cream desaturated by
 *                           ~12%, ember warmed) so colours don't shift hard
 *                           when an offset press converts the file. **True
 *                           CMYK ICC conversion requires a server-side step
 *                           or Acrobat Pro's "Convert Colors" action** — the
 *                           browser cannot emit a real CMYK PDF. The handout
 *                           page surfaces a one-line banner explaining this.
 *                           See ambiguity log 05.
 *
 *   - **SVG (per slide)** — serializes the live `.handout-stage` DOM into an
 *                           SVG document with a single 1920x1080
 *                           `<foreignObject>` containing the slide HTML +
 *                           inlined CSS variables. Vector-clean, RGB only.
 *                           One file per slide, downloaded sequentially.
 *
 *   - **PNG / JPG**       — rasterizes each per-slide SVG via an offscreen
 *                           `<canvas>`. PNG keeps transparency; JPG renders
 *                           on the deck's ink background. Sequential
 *                           downloads, 1920x1080 native resolution.
 *
 * # Why no extra deps
 * `html2canvas`, `jsPDF`, and `html-to-image` add 200–600KB to the bundle
 * each. The browser already has every primitive we need: `XMLSerializer`,
 * `<foreignObject>`, `Blob`, `URL.createObjectURL`, `canvas.toBlob`, and
 * `window.print()`. Total cost of this module: ~6KB minified.
 *
 * # Limitations (documented for the user)
 *   1. Web fonts (Ubuntu/Inter) must be loaded before SVG/PNG/JPG export
 *      fires; the exporter awaits `document.fonts.ready` to guarantee this.
 *   2. `<foreignObject>` images must be same-origin or CORS-enabled. Local
 *      `/src/assets/...` paths satisfy this.
 *   3. PNG/JPG export uses each slide's first paint — no animation frames.
 *
 * # Where to call this from
 *   - `src/pages/SettingsPage.tsx` → "Export deck" section (primary UI).
 *   - `src/slides/controls/ShareMenu.tsx` → keeps the existing "Export PDF
 *     (handout)" entry, which is the no-questions default for muscle memory.
 */

import { linearSlides, deck } from './loader';
import { toast } from 'sonner';

export type ExportFormat = 'pdf-rgb' | 'pdf-cmyk' | 'svg' | 'png' | 'jpg';

export interface ExportFormatMeta {
  id: ExportFormat;
  label: string;
  description: string;
  /** True when this format spawns a single combined output (a print dialog or one file). */
  combinedOutput: boolean;
}

export const EXPORT_FORMATS: ExportFormatMeta[] = [
  {
    id: 'pdf-rgb',
    label: 'PDF (RGB)',
    description: 'Screen-accurate PDF via the browser print dialog. One slide per A4 landscape page. Best for digital sharing and most office printers.',
    combinedOutput: true,
  },
  {
    id: 'pdf-cmyk',
    label: 'PDF (CMYK-safe)',
    description: 'Same PDF flow, with a desaturated colour filter that approximates the CMYK gamut so the palette does not shift on offset press. True ICC CMYK requires Acrobat Pro post-processing.',
    combinedOutput: true,
  },
  {
    id: 'svg',
    label: 'SVG (vector, per slide)',
    description: 'One vector SVG per slide at 1920×1080. RGB. Crisp at any zoom, perfect for editing in Figma or Illustrator.',
    combinedOutput: false,
  },
  {
    id: 'png',
    label: 'PNG (raster, per slide)',
    description: 'One PNG per slide at 1920×1080 with the ink background. Use for thumbnails, social cards, or slide decks that need image embedding.',
    combinedOutput: false,
  },
  {
    id: 'jpg',
    label: 'JPG (raster, per slide)',
    description: 'One JPG per slide at 1920×1080, q=92 quality. Smaller file sizes than PNG; lossy. Good for previews.',
    combinedOutput: false,
  },
];

/** PDF flows reuse the existing /handout route. */
function exportPdf(opts: { cmyk: boolean }) {
  const params = new URLSearchParams({ print: '1' });
  if (opts.cmyk) params.set('cmyk', '1');
  const url = `${window.location.origin}/handout?${params.toString()}`;
  window.open(url, '_blank', 'noopener');
}

/**
 * Serialize the document's live <style> and <link rel="stylesheet"> rules
 * into a single CSS string so foreignObject renders look identical to the
 * on-screen slide. We snapshot once and reuse for every slide in a batch.
 */
function snapshotInlineCss(): string {
  const chunks: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;
      for (const rule of Array.from(rules)) chunks.push(rule.cssText);
    } catch {
      // Cross-origin stylesheets throw on cssRules access. They're typically
      // Google Fonts CSS, which we already inline via @font-face fallbacks
      // baked into index.css — safe to skip.
    }
  }
  // Inline the CSS variables from <html> so colour tokens resolve inside
  // the foreignObject sandbox.
  const computed = window.getComputedStyle(document.documentElement);
  const tokens: string[] = [];
  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    if (prop.startsWith('--')) {
      tokens.push(`${prop}: ${computed.getPropertyValue(prop).trim()};`);
    }
  }
  return `:root { ${tokens.join(' ')} } ${chunks.join('\n')}`;
}

/**
 * Wrap a slide DOM node into a standalone SVG document with foreignObject.
 * The output is a self-contained string that any browser can rasterize.
 */
function slideToSvgString(stageHtml: string, css: string): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">',
    '<foreignObject x="0" y="0" width="1920" height="1080">',
    '<div xmlns="http://www.w3.org/1999/xhtml" style="width:1920px;height:1080px;">',
    `<style>${css}</style>`,
    stageHtml,
    '</div>',
    '</foreignObject>',
    '</svg>',
  ].join('');
}

/** Trigger a browser download for a Blob with the given filename. */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revoke so the download has time to start before the URL drops.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Open the /handout route off-screen, wait for it to render, then return its slide DOM nodes. */
async function captureHandoutFrames(): Promise<HTMLElement[]> {
  // Open the handout in a hidden iframe so we get every slide rendered at
  // 1920x1080 simultaneously without disturbing the user's current view.
  const iframe = document.createElement('iframe');
  iframe.src = `${window.location.origin}/handout`;
  iframe.style.cssText = 'position:fixed;left:-99999px;top:0;width:1920px;height:1080px;border:0;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);
  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
  });
  // Give Framer Motion + asset preload one settle frame.
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  // Wait for fonts inside the iframe so rasterized text uses Ubuntu/Inter,
  // not the system fallback.
  const idoc = iframe.contentDocument;
  if (idoc?.fonts && 'ready' in idoc.fonts) {
    await idoc.fonts.ready;
  }
  if (!idoc) {
    iframe.remove();
    throw new Error('Could not access handout iframe document.');
  }
  const stages = Array.from(idoc.querySelectorAll<HTMLElement>('.handout-stage'));
  // Detach the iframe later — caller owns lifecycle so the cloned nodes stay live.
  // We snapshot innerHTML eagerly because some callers serialize after we drop the iframe.
  const frames = stages.map((s) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = s.innerHTML;
    return wrapper;
  });
  iframe.remove();
  return frames;
}

async function exportSvg(): Promise<number> {
  const css = snapshotInlineCss();
  const frames = await captureHandoutFrames();
  let count = 0;
  for (let i = 0; i < frames.length; i++) {
    const slide = linearSlides[i];
    const svg = slideToSvgString(frames[i].innerHTML, css);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const safeName = (slide.slideName ?? `slide-${slide.slideNumber}`).replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
    downloadBlob(blob, `${deck.deckSlug}-${String(i + 1).padStart(2, '0')}-${safeName}.svg`);
    count++;
    // Stagger downloads so the browser doesn't block the second+ as a popup.
    await new Promise((r) => setTimeout(r, 250));
  }
  return count;
}

async function rasterizeSvgToBlob(svg: string, mime: 'image/png' | 'image/jpeg', quality = 0.92): Promise<Blob> {
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('SVG rasterization failed (likely a cross-origin asset).'));
    });
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable.');
    if (mime === 'image/jpeg') {
      // JPG cannot encode alpha — paint the deck ink first.
      const ink = window.getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '0 0% 5%';
      ctx.fillStyle = `hsl(${ink})`;
      ctx.fillRect(0, 0, 1920, 1080);
    }
    ctx.drawImage(img, 0, 0, 1920, 1080);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
    if (!blob) throw new Error(`Canvas could not produce a ${mime} blob.`);
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function exportRaster(format: 'png' | 'jpg'): Promise<number> {
  const css = snapshotInlineCss();
  const frames = await captureHandoutFrames();
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';
  let count = 0;
  for (let i = 0; i < frames.length; i++) {
    const slide = linearSlides[i];
    const svg = slideToSvgString(frames[i].innerHTML, css);
    const blob = await rasterizeSvgToBlob(svg, mime);
    const safeName = (slide.slideName ?? `slide-${slide.slideNumber}`).replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
    downloadBlob(blob, `${deck.deckSlug}-${String(i + 1).padStart(2, '0')}-${safeName}.${ext}`);
    count++;
    await new Promise((r) => setTimeout(r, 300));
  }
  return count;
}

/**
 * Top-level dispatcher. Single entrypoint so callers don't need to know
 * the format-specific plumbing. Surfaces toasts for progress + errors.
 */
export async function runExport(format: ExportFormat): Promise<void> {
  try {
    if (format === 'pdf-rgb') {
      exportPdf({ cmyk: false });
      toast.success('Opening print dialog…', { description: 'Choose "Save as PDF" in the new tab.' });
      return;
    }
    if (format === 'pdf-cmyk') {
      exportPdf({ cmyk: true });
      toast.success('Opening CMYK-safe print dialog…', {
        description: 'Colours are pre-desaturated. Use Acrobat Pro for a true ICC CMYK conversion.',
      });
      return;
    }
    const meta = EXPORT_FORMATS.find((f) => f.id === format);
    toast.info(`Preparing ${meta?.label ?? format}…`, { description: `Rendering ${linearSlides.length} slides at 1920×1080.` });
    // Make sure web fonts are ready in the parent doc so the snapshot
    // captures rules referencing them.
    if (document.fonts && 'ready' in document.fonts) await document.fonts.ready;

    let count = 0;
    if (format === 'svg') count = await exportSvg();
    else if (format === 'png') count = await exportRaster('png');
    else if (format === 'jpg') count = await exportRaster('jpg');

    toast.success(`Exported ${count} ${count === 1 ? 'slide' : 'slides'}`, {
      description: 'Check your downloads folder. Allow multiple downloads if your browser asks.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown export error.';
    toast.error('Export failed', { description: msg });
  }
}
