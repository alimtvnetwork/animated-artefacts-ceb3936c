import { Check, Trash2 } from 'lucide-react';
import { THEMES, type ThemeId } from '../themes';
import { isCustomThemeId } from '../themeManifest';
import { getReferenceFrame } from './referenceFrames';

function ReferenceFrameThumb({ src, label }: { src: string; label: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-full left-0 z-20 mt-1 hidden w-24 overflow-hidden rounded-md ring-1 ring-[hsl(0_0%_100%/0.2)] shadow-lg group-hover:block"
    >
      <img src={src} alt="" className="block w-full" />
      <span className="block px-1 py-0.5 text-[8px] text-center bg-[hsl(0_0%_0%/0.7)] text-[hsl(0_0%_100%)]">
        {label} reference
      </span>
    </span>
  );
}

const GOLD_RING = { ['--tw-ring-color' as string]: 'hsl(var(--gold) / 0.55)' };

function swatchGradient(hexes: readonly string[]): string {
  const stops = hexes.length ? hexes : ['#000', '#333'];
  return `linear-gradient(135deg, ${stops.join(', ')})`;
}

interface TileProps {
  id: ThemeId;
  isActive: boolean;
  onPick: (id: ThemeId) => void;
  onRemoveCustom: (id: string, e: React.MouseEvent) => void;
}

function ThemeTile({ id, isActive, onPick, onRemoveCustom }: TileProps) {
  const t = THEMES[id];
  const isCustom = isCustomThemeId(id);
  const frame = getReferenceFrame(id);
  return (
    <div className="group relative">
      <button
        onClick={() => onPick(id)}
        role="menuitemradio"
        aria-checked={isActive}
        title={`${t.label} — ${t.description}`}
        style={GOLD_RING}
        className={`relative block w-full aspect-square rounded-lg overflow-hidden transition focus-visible:outline-none focus-visible:ring-2 ${
          isActive ? 'ring-2 ring-gold' : 'ring-1 ring-[hsl(0_0%_100%/0.14)] hover:ring-[hsl(0_0%_100%/0.4)]'
        }`}
      >
        <span aria-hidden className="absolute inset-0" style={{ background: swatchGradient(t.swatch) }} />
        <span
          aria-hidden
          className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: t.swatch[0], boxShadow: '0 0 0 1.5px hsl(0 0% 0% / 0.5)' }}
        />
        {isActive && (
          <span className="absolute inset-0 flex items-center justify-center bg-[hsl(0_0%_0%/0.35)]">
            <Check className="h-4 w-4 text-gold" />
          </span>
        )}
        {isCustom && (
          <span
            className="absolute top-1 left-1 px-1 rounded text-[8px] font-semibold uppercase tracking-wide"
            style={{ background: 'hsl(var(--gold) / 0.85)', color: 'hsl(0 0% 0%)' }}
          >
            Imp
          </span>
        )}
      </button>
      {isCustom && (
        <button
          onClick={(e) => onRemoveCustom(id, e)}
          aria-label={`Remove imported theme ${t.label}`}
          title="Remove imported theme"
          style={GOLD_RING}
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition bg-[hsl(8_80%_45%)] text-[hsl(0_0%_100%)] focus-visible:outline-none focus-visible:ring-2"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      )}
      {frame && <ReferenceFrameThumb src={frame} label={t.label} />}
    </div>
  );
}

interface GridProps {
  active: ThemeId;
  onPick: (id: ThemeId) => void;
  onRemoveCustom: (id: string, e: React.MouseEvent) => void;
}

export function ThemeSwatchGrid({ active, onPick, onRemoveCustom }: GridProps) {
  return (
    <div role="group" aria-label="Theme palettes" className="grid grid-cols-4 gap-1.5 px-1 pb-1">
      {(Object.keys(THEMES) as ThemeId[]).map((id) => (
        <ThemeTile
          key={id}
          id={id}
          isActive={active === id}
          onPick={onPick}
          onRemoveCustom={onRemoveCustom}
        />
      ))}
    </div>
  );
}
