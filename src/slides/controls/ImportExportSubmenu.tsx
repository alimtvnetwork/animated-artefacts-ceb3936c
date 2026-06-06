import { useRef, useState } from 'react';
import { ChevronRight, ClipboardCopy, Download, FileDown, FileJson, Image as ImageIcon, Package, Palette, Presentation, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/errors';
import { deck, allSlides, IMPORTED_MANIFEST_KEY } from '../loader';
import { runExport, exportSlidePdf } from '../export';
import { exportDeckToPptx } from '../exportPptx';
import { exportSlideJson } from '../slideJson';
import { buildManifest } from '../manifest';
import { downloadJson } from '../downloadJson';
import { inlineImagePayload } from '../inlineImages';
import { planSingleSlideImport } from '../slideJsonImport';
import { exportAllThemes, parseThemeBundle, installAllThemes } from '../themeBulk';
import { exportBundleZip, importBundleFile } from '../zipBundle';
import { copyLlmGuideToClipboard, downloadLlmGuide } from '../llmGuideBundle';

interface Props {
  currentSlideNumber: number;
  itemClass: string;
  labelClass: string;
  onCloseParent: () => void;
  onOpenDeckTools: () => void;
  onOpenThemeTools: () => void;
  /** When true the section list is always shown and the collapsible
   *  "Import / Export" toggle header is hidden. Used by the dedicated
   *  Import/Export popover (vs. the nested hamburger submenu). */
  bare?: boolean;
}



export function ImportExportSubmenu({
  currentSlideNumber,
  itemClass,
  labelClass,
  onCloseParent,
  onOpenDeckTools,
  onOpenThemeTools,
  bare = false,
}: Props) {
  const [expanded, setExpanded] = useState(bare);
  const slideImportRef = useRef<HTMLInputElement | null>(null);
  const themesImportRef = useRef<HTMLInputElement | null>(null);
  const bundleImportRef = useRef<HTMLInputElement | null>(null);

  function handleSlideJson() {
    try {
      const filename = exportSlideJson(currentSlideNumber);
      toast.success('Slide JSON exported', { description: filename });
      onCloseParent();
    } catch (err) {
      console.error('[ImportExportSubmenu] Single-slide JSON export failed', err);
      toast.error('Could not export slide JSON', { description: errorMessage(err) });
    }
  }

  function handleThemesExport() {
    try {
      const filename = exportAllThemes();
      toast.success('All themes exported', { description: filename });
      onCloseParent();
    } catch (err) {
      console.error('[ImportExportSubmenu] Bulk theme export failed', err);
      toast.error('Could not export themes', { description: errorMessage(err) });
    }
  }

  async function handleThemesImportFile(file: File) {
    try {
      const bundle = parseThemeBundle(JSON.parse(await file.text()));
      const count = installAllThemes(bundle);
      toast.success('Themes imported', { description: `${count} custom theme${count === 1 ? '' : 's'} installed.` });
      onCloseParent();
    } catch (err) {
      console.error('[ImportExportSubmenu] Bulk theme import failed', err);
      toast.error('Could not import themes', { description: errorMessage(err) });
    } finally {
      if (themesImportRef.current) themesImportRef.current.value = '';
    }
  }

  async function handleGuideDownload() {
    try {
      const filename = downloadLlmGuide();
      toast.success('LLM guide downloaded', { description: filename });
      onCloseParent();
    } catch (err) {
      console.error('[ImportExportSubmenu] LLM guide download failed', err);
      toast.error('Could not generate LLM guide', { description: errorMessage(err) });
    }
  }

  async function handleGuideCopy() {
    try {
      const ok = await copyLlmGuideToClipboard();
      if (!ok) {
        console.warn('[ImportExportSubmenu] Clipboard copy blocked for LLM guide');
        toast.error('Clipboard copy blocked — try Download instead');
        return;
      }
      toast.success('LLM guide copied to clipboard');
      onCloseParent();
    } catch (err) {
      console.error('[ImportExportSubmenu] LLM guide copy failed', err);
      toast.error('Could not copy LLM guide', { description: errorMessage(err) });
    }
  }

  async function handleDeckPdf() {
    console.info('[ImportExportSubmenu] Export deck to PDF');
    await runExport('pdf-rgb');
    onCloseParent();
  }

  function handleSlidePdf() {
    try {
      console.info(`[ImportExportSubmenu] Export current slide ${currentSlideNumber} to PDF`);
      exportSlidePdf(currentSlideNumber);
      onCloseParent();
    } catch (err) {
      console.error('[ImportExportSubmenu] Single-slide PDF failed', err);
      toast.error('Could not export slide to PDF', { description: errorMessage(err) });
    }
  }

  async function handleDeckPptx() {
    try {
      console.info('[ImportExportSubmenu] Export deck to PPTX');
      const filename = await exportDeckToPptx();
      toast.success('PPTX exported', { description: filename });
      onCloseParent();
    } catch (err) {
      console.error('[ImportExportSubmenu] PPTX export failed', err);
      toast.error('Could not export PPTX', { description: errorMessage(err) });
    }
  }

  async function handleDeckJsonEmbedded() {
    try {
      toast.info('Embedding images…', { description: 'Fetching and encoding deck images as Base64.' });
      const manifest = buildManifest(deck, allSlides);
      const { payload, inlined } = await inlineImagePayload(manifest);
      const filename = `${deck.deckSlug}-deck-embedded-${new Date().toISOString().slice(0, 10)}.json`;
      downloadJson(payload, filename);
      toast.success('Deck JSON exported (images embedded)', {
        description: `${inlined} image${inlined === 1 ? '' : 's'} inlined as Base64 · ${filename}`,
      });
      onCloseParent();
    } catch (err) {
      console.error('[ImportExportSubmenu] Embedded deck JSON export failed', err);
      toast.error('Could not export embedded deck JSON', { description: errorMessage(err) });
    }
  }

  async function handleSlideImportFile(file: File) {
    try {
      const payload = JSON.parse(await file.text()) as unknown;
      const plan = planSingleSlideImport(deck, allSlides, payload, currentSlideNumber);
      window.localStorage.setItem(IMPORTED_MANIFEST_KEY, JSON.stringify(plan.manifest));
      console.info(`[ImportExportSubmenu] Single-slide import ready: ${file.name} -> slide #${plan.insertedNumber}`);
      toast.success('Slide imported', { description: `Inserted as slide ${plan.insertedNumber}. Reloading…` });
      onCloseParent();
      window.setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      console.error('[ImportExportSubmenu] Single-slide JSON import failed', err);
      toast.error('Could not import slide JSON', { description: errorMessage(err) });
    } finally {
      if (slideImportRef.current) slideImportRef.current.value = '';
    }
  }

  function handleBundleExport() {
    try {
      const filename = exportBundleZip();
      toast.success('Bundle exported', { description: filename });
      onCloseParent();
    } catch (err) {
      console.error('[ImportExportSubmenu] Bundle ZIP export failed', err);
      toast.error('Could not export bundle', { description: errorMessage(err) });
    }
  }

  async function handleBundleImportFile(file: File) {
    try {
      const result = await importBundleFile(file);
      console.info(`[ImportExportSubmenu] Bundle import ready: ${file.name} (${result.slideCount} slides, ${result.themeCount} themes)`);
      toast.success('Bundle imported', {
        description: `${result.slideCount} slide${result.slideCount === 1 ? '' : 's'} · ${result.themeCount} theme${result.themeCount === 1 ? '' : 's'}. Reloading…`,
      });
      onCloseParent();
      window.setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      console.error('[ImportExportSubmenu] Bundle ZIP import failed', err);
      toast.error('Could not import bundle', { description: errorMessage(err) });
    } finally {
      if (bundleImportRef.current) bundleImportRef.current.value = '';
    }
  }

  return (
    <>
      {!bare && (
        <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className={itemClass}>
          <Package className="h-4 w-4" />
          <span className="flex-1">Import / Export</span>
          <ChevronRight className={`h-3.5 w-3.5 opacity-60 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      )}
      {expanded && (
        <div className={bare ? '' : 'ml-2 border-l border-[hsl(var(--chrome-border))] pl-2'}>

          <div className={labelClass}>Slides</div>
          <input ref={slideImportRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSlideImportFile(f); }} />
          <button type="button" onClick={() => slideImportRef.current?.click()} className={itemClass}><Upload className="h-4 w-4" /><span className="flex-1">Import JSON (single)</span></button>
          <button type="button" onClick={onOpenDeckTools} className={itemClass}><Upload className="h-4 w-4" /><span className="flex-1">Import JSON (all/deck)</span></button>
          <button type="button" onClick={handleSlideJson} className={itemClass}><Download className="h-4 w-4" /><span className="flex-1">Export JSON (current slide)</span></button>
          <button type="button" onClick={onOpenDeckTools} className={itemClass}><FileJson className="h-4 w-4" /><span className="flex-1">Export JSON (all/deck)</span></button>
          <button type="button" onClick={handleDeckJsonEmbedded} className={itemClass}><ImageIcon className="h-4 w-4" /><span className="flex-1">Export JSON (all, images embedded)</span></button>

          <div className={labelClass}>Themes</div>
          <input ref={themesImportRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThemesImportFile(f); }} />
          <button type="button" onClick={onOpenThemeTools} className={itemClass}><Upload className="h-4 w-4" /><span className="flex-1">Import theme (single)</span></button>
          <button type="button" onClick={() => themesImportRef.current?.click()} className={itemClass}><Upload className="h-4 w-4" /><span className="flex-1">Import themes (all)</span></button>
          <button type="button" onClick={onOpenThemeTools} className={itemClass}><Palette className="h-4 w-4" /><span className="flex-1">Export theme (single/active)</span></button>
          <button type="button" onClick={handleThemesExport} className={itemClass}><Palette className="h-4 w-4" /><span className="flex-1">Export themes (all)</span></button>

          <div className={labelClass}>PDF</div>
          <button type="button" onClick={handleDeckPdf} className={itemClass}><FileDown className="h-4 w-4" /><span className="flex-1">Export deck to PDF</span></button>
          <button type="button" onClick={handleSlidePdf} className={itemClass}><FileDown className="h-4 w-4" /><span className="flex-1">Export current slide to PDF</span></button>

          <div className={labelClass}>Full bundle</div>
          <input ref={bundleImportRef} type="file" accept="application/zip,.zip" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBundleImportFile(f); }} />
          <button type="button" onClick={handleBundleExport} className={itemClass}><Download className="h-4 w-4" /><span className="flex-1">Export ZIP (deck + themes)</span></button>
          <button type="button" onClick={() => bundleImportRef.current?.click()} className={itemClass}><Upload className="h-4 w-4" /><span className="flex-1">Import ZIP (deck + themes)</span></button>

          <div className={labelClass}>Authoring guide</div>
          <button type="button" onClick={handleGuideDownload} className={itemClass}><Download className="h-4 w-4" /><span className="flex-1">Download LLM guide (.md)</span></button>
          <button type="button" onClick={handleGuideCopy} className={itemClass}><ClipboardCopy className="h-4 w-4" /><span className="flex-1">Copy LLM guide</span></button>
        </div>
      )}
    </>
  );
}