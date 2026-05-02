/**
 * Slide list sidebar. Shows every slide in the draft deck with its number,
 * type, and selection state. Provides add / duplicate / delete / reorder.
 *
 * Reorder is intentionally simple (▲/▼ buttons) — drag-and-drop adds a third
 * dependency for a workflow most authors only do a handful of times.
 */
import { Plus, Copy, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SlideSpec } from '../slides/types';
import { SLIDE_TYPE_KEYS, SLIDE_TYPE_SCHEMAS } from './fieldSchemas';
import type { SlideTypeValue } from '../slides/enums';
import { useState } from 'react';

interface Props {
  slides: SlideSpec[];
  selectedNumber: number | null;
  onSelect: (slideNumber: number) => void;
  onAdd: (type: SlideTypeValue) => void;
  onDuplicate: (slideNumber: number) => void;
  onRemove: (slideNumber: number) => void;
  onMove: (slideNumber: number, toIndex: number) => void;
}

export function SlideListSidebar({
  slides,
  selectedNumber,
  onSelect,
  onAdd,
  onDuplicate,
  onRemove,
  onMove,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Slides</h2>
        <span className="text-[11px] text-muted-foreground">{slides.length}</span>
      </div>

      <div className="space-y-1">
        {slides.length === 0 && (
          <p className="text-xs text-muted-foreground/70 italic px-2 py-3 text-center border border-dashed border-border rounded-md">
            No slides yet. Add the first one below.
          </p>
        )}
        {slides.map((s, idx) => {
          const isSel = s.slideNumber === selectedNumber;
          return (
            <div
              key={s.slideNumber}
              className={[
                'group flex items-center gap-1.5 px-2 py-2 rounded-md border transition-colors',
                isSel ? 'border-gold/50 bg-gold/10' : 'border-border bg-surface-1/30 hover:border-foreground/20',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => onSelect(s.slideNumber)}
                className="flex-1 text-left min-w-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono w-6 text-muted-foreground tabular-nums">
                    {String(s.slideNumber).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{s.slideName || 'untitled'}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{SLIDE_TYPE_SCHEMAS[s.slideType].label}</div>
                  </div>
                </div>
              </button>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onMove(s.slideNumber, idx - 1)}
                  disabled={idx === 0}
                  className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(s.slideNumber, idx + 1)}
                  disabled={idx === slides.length - 1}
                  className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicate(s.slideNumber)}
                  className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Duplicate slide"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(s.slideNumber)}
                  className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-destructive"
                  aria-label="Delete slide"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add slide */}
      {!pickerOpen && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setPickerOpen(true)}
          className="w-full"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add slide
        </Button>
      )}
      {pickerOpen && (
        <div className="space-y-1 p-2 border border-border rounded-md bg-surface-1/40">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 pb-1">
            Choose slide type
          </div>
          {SLIDE_TYPE_KEYS.map(key => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onAdd(key);
                setPickerOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-white/5 transition-colors"
            >
              <div className="font-medium">{SLIDE_TYPE_SCHEMAS[key].label}</div>
              <div className="text-[10px] text-muted-foreground line-clamp-1">{SLIDE_TYPE_SCHEMAS[key].blurb}</div>
            </button>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={() => setPickerOpen(false)} className="w-full text-xs">
            Cancel
          </Button>
        </div>
      )}

      {/* QA layout checklist — links to spec doc; opens in a new tab.
          See spec/21-slides-system/99-qa-layout-checklist.md. */}
      <a
        href="https://github.com/riseup-asia/slides/blob/main/spec/21-slides-system/99-qa-layout-checklist.md"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center text-[10px] uppercase tracking-wider text-muted-foreground/70 hover:text-gold transition-colors py-1.5 border-t border-border/40 mt-2"
        title="Open the slide layout QA checklist (logo inset, rail position, overlap rules)"
      >
        QA layout checklist ↗
      </a>
    </div>
  );
}
