import { Package, X } from 'lucide-react';
import { ImportExportSubmenu } from './ImportExportSubmenu';

interface Props {
  currentSlideNumber: number;
  onClose: () => void;
  /** Opens the deck-level manifest popover (DeckMenu) for all/deck JSON. */
  onOpenDeckTools: () => void;
  /** Opens the theme popover (ThemeMenu) for single-theme import/export. */
  onOpenThemeTools: () => void;
}

/**
 * Dedicated, always-expanded Import / Export popover opened from the
 * controller's "Deck manifest" (FileJson) button. Surfaces the full
 * organized tree — Slides · Themes · PDF · Full bundle · Authoring guide —
 * with single-slide import/export front and centre, instead of burying it
 * inside the hamburger presenter menu.
 */
export function ImportExportMenu({ currentSlideNumber, onClose, onOpenDeckTools, onOpenThemeTools }: Props) {
  const itemClass =
    'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-left ' +
    'hover:bg-white/5 focus:bg-white/5 focus:outline-none transition-colors cursor-pointer';
  const labelClass =
    'px-2 pt-3 pb-1 text-foreground/55 uppercase text-[10px] tracking-widest';

  return (
    <div
      role="menu"
      className="absolute top-full mt-3 right-0 w-80 max-h-[70vh] overflow-y-auto rounded-2xl controller-pill p-2 shadow-2xl"
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gold" />
          <span className="text-sm font-medium">Import / Export</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="lift-hover-subtle h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/5 transition"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <ImportExportSubmenu
        bare
        currentSlideNumber={currentSlideNumber}
        itemClass={itemClass}
        labelClass={labelClass}
        onCloseParent={onClose}
        onOpenDeckTools={onOpenDeckTools}
        onOpenThemeTools={onOpenThemeTools}
      />
    </div>
  );
}
