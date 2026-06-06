import { useRef, useState } from 'react';
import { ChevronRight, ClipboardCopy, Download, FileDown, FileJson, Package, Palette, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/errors';
import { runExport, exportSlidePdf } from '../export';
import { exportSlideJson } from '../slideJson';
import { exportAllThemes, parseThemeBundle, installAllThemes } from '../themeBulk';
import { copyLlmGuideToClipboard, downloadLlmGuide } from '../llmGuideBundle';

interface Props {
  currentSlideNumber: number;
  itemClass: string;
  labelClass: string;
  onCloseParent: () => void;
  onOpenDeckTools: () => void;
  onOpenThemeTools: () => void;
}

const SOON_BADGE = 'rounded-md bg-[hsl(var(--chrome-hover))] px-1.5 py-0.5 text-[10px] text-[hsl(var(--chrome-fg-muted))]';

function planned(label: string) {
  console.info(`[ImportExportSubmenu] Planned action clicked: ${label}`);
  toast.info('Planned next', {
    description: `${label} is scaffolded in the menu tree and lands in a follow-up import/export step.`,
  });
}

export function ImportExportSubmenu({
  currentSlideNumber,
  itemClass,
  labelClass,
  onCloseParent,
  onOpenDeckTools,
  onOpenThemeTools,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const themesImportRef = useRef<HTMLInputElement | null>(null);

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

  return (
    <>
      <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className={itemClass}>
        <Package className="h-4 w-4" />
        <span className="flex-1">Import / Export</span>
        <ChevronRight className={`h-3.5 w-3.5 opacity-60 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="ml-2 border-l border-[hsl(var(--chrome-border))] pl-2">
          <div className={labelClass}>Slides</div>
          <button type="button" onClick={() => planned('Import JSON (single slide)')} className={itemClass}><Upload className="h-4 w-4" /><span className="flex-1">Import JSON (single)</span><span className={SOON_BADGE}>Soon</span></button>
          <button type="button" onClick={onOpenDeckTools} className={itemClass}><Upload className="h-4 w-4" /><span className="flex-1">Import JSON (all/deck)</span></button>
          <button type="button" onClick={handleSlideJson} className={itemClass}><Download className="h-4 w-4" /><span className="flex-1">Export JSON (current slide)</span></button>
          <button type="button" onClick={onOpenDeckTools} className={itemClass}><FileJson className="h-4 w-4" /><span className="flex-1">Export JSON (all/deck)</span></button>

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
          <button type="button" onClick={() => planned('Export ZIP')} className={itemClass}><Download className="h-4 w-4" /><span className="flex-1">Export ZIP</span><span className={SOON_BADGE}>Soon</span></button>
          <button type="button" onClick={() => planned('Import ZIP')} className={itemClass}><Upload className="h-4 w-4" /><span className="flex-1">Import ZIP</span><span className={SOON_BADGE}>Soon</span></button>

          <div className={labelClass}>Authoring guide</div>
          <button type="button" onClick={handleGuideDownload} className={itemClass}><Download className="h-4 w-4" /><span className="flex-1">Download LLM guide (.md)</span></button>
          <button type="button" onClick={handleGuideCopy} className={itemClass}><ClipboardCopy className="h-4 w-4" /><span className="flex-1">Copy LLM guide</span></button>
        </div>
      )}
    </>
  );
}