import { useEffect, useRef, useState } from 'react';
import { Link2, Layers, FileDown, FilePlus2, Presentation } from 'lucide-react';
import { allSlides } from '@/slides/loader';
import { exportDeckToPptx } from '@/slides/exportPptx';

interface Props {
  currentSlide: number;
  onClose: () => void;
}

export function ShareMenu({ currentSlide, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // v0.154 — pptx generation runs entirely client-side via pptxgenjs and
  // can take ~300-800ms for a 20-slide deck (every shape is built
  // synchronously). Show a "Generating…" state on the button so the user
  // knows the click registered, and prevent double-firing.
  const [pptxBusy, setPptxBusy] = useState(false);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  async function handlePptxExport() {
    if (pptxBusy) return;
    setPptxBusy(true);
    try {
      const filename = await exportDeckToPptx();
      const t = document.createElement('div');
      t.textContent = `${filename} downloaded`;
      t.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] capsule capsule-gold animate-fade-in';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2200);
    } catch (err) {
      console.error('PPTX export failed', err);
      const t = document.createElement('div');
      t.textContent = 'PPTX export failed — see console';
      t.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] capsule capsule-ember animate-fade-in';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2600);
    } finally {
      setPptxBusy(false);
      onClose();
    }
  }

  async function copy(url: string, label: string) {
    await navigator.clipboard.writeText(url);
    onClose();
    const t = document.createElement('div');
    t.textContent = `${label} copied`;
    t.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] capsule capsule-gold animate-fade-in';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  const origin = window.location.origin;
  // v0.153 — only surface the "with reveals" entry when the deck actually
  // contains click-reveal sub-slides; otherwise it's a no-op that just
  // duplicates the standard handout.
  const hasReveals = allSlides.some(s => s.isClickReveal);
  return (
    <div ref={ref} className="absolute bottom-full mb-3 right-0 controller-pill rounded-2xl p-1.5 min-w-[220px]">
      <button onClick={() => copy(`${origin}/${currentSlide}`, 'Slide link')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left text-sm lift-hover-subtle">
        <Link2 className="h-4 w-4 text-gold" />
        <div>
          <div className="font-medium">Share current slide</div>
          <div className="text-xs text-foreground/50">/{currentSlide}</div>
        </div>
      </button>
      <button onClick={() => copy(`${origin}/1`, 'Deck link')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left text-sm lift-hover-subtle">
        <Layers className="h-4 w-4 text-ember" />
        <div>
          <div className="font-medium">Share entire deck</div>
          <div className="text-xs text-foreground/50">From slide 1</div>
        </div>
      </button>
      {/* Spec 28 — one-click PDF handout. Opens /handout?print=1 in a new
          tab; HandoutPage mounts every slide stacked, sets data-export-mode
          (which freezes both CSS and Framer animations on their final state
          via motionPreferences flatteners), and auto-fires window.print()
          on first paint so the user lands directly in the save-as-PDF
          dialog. The new tab keeps the live deck untouched. */}
      <button
        onClick={() => {
          window.open(`${origin}/handout?print=1`, '_blank', 'noopener');
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left text-sm lift-hover-subtle"
      >
        <FileDown className="h-4 w-4 text-cream" />
        <div>
          <div className="font-medium">Export PDF (handout)</div>
          <div className="text-xs text-foreground/50">All slides, animations off</div>
        </div>
      </button>
      {/* v0.153 — opt-in variant that interleaves click-reveal sub-slides
          after their parent so the PDF captures every hidden expansion.
          Only rendered when the deck has reveals to include. */}
      {hasReveals && (
        <button
          onClick={() => {
            window.open(`${origin}/handout?print=1&reveals=1`, '_blank', 'noopener');
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left text-sm lift-hover-subtle"
        >
          <FilePlus2 className="h-4 w-4 text-gold" />
          <div>
            <div className="font-medium">Export PDF + reveals</div>
            <div className="text-xs text-foreground/50">All slides incl. click-reveal expansions</div>
          </div>
        </button>
      )}
      {/* v0.154 — PPTX export. Generates a fully-editable PowerPoint via
          pptxgenjs entirely in the browser — no /handout route, no print
          dialog. Animations are inherently absent because PPTX is static,
          so "final states preserved" is satisfied for free. The deck's
          Noir & Gold palette is reproduced with native shapes/textboxes
          (no rasterised art) so the user can edit text and reposition
          elements in PowerPoint. */}
      <button
        onClick={handlePptxExport}
        disabled={pptxBusy}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left text-sm lift-hover-subtle disabled:opacity-60 disabled:cursor-wait"
      >
        <Presentation className="h-4 w-4 text-cream" />
        <div>
          <div className="font-medium">{pptxBusy ? 'Generating PPTX…' : 'Export PPTX (editable)'}</div>
          <div className="text-xs text-foreground/50">PowerPoint, animations off, fully editable</div>
        </div>
      </button>
    </div>
  );
}
