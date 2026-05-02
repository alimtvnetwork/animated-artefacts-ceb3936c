/**
 * Ambient-background presets — named bundles of icons + tuning that any
 * slide can opt into via `slide.ambientBackground = "devtools"` (or
 * a full `AmbientBackgroundSpec` object).
 *
 * Spec: `spec/slides/24-ambient-background.md` §6 (presets).
 *
 * Each preset is a small object the SlideStage merges with the user's
 * overrides before forwarding to `<AmbientBackground>`. Per-icon brand
 * accent maps are kept here so authors don't need to memorize index → hex
 * mappings; named presets always carry their own canonical accent set.
 */
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Code2, Terminal, GitBranch, Github, Figma, Boxes, Cpu, Cloud,
  FileText, Video, MessageSquare, Clipboard, UserCheck, Book, Users,
  Compass, Target, Hammer, TrendingUp, Workflow, Layers, Activity, Sparkles,
} from 'lucide-react';
import type { AmbientBackgroundSpec, AmbientPresetName } from './types';

export interface ResolvedAmbient {
  icons: ComponentType<LucideProps>[];
  count: number;
  opacity: number;
  drift: number;
  glow: boolean;
  parallax: number;
  /** Per-icon brand-color accent map (index → hex). */
  accentColors?: Record<number, string>;
}

const PRESET_DEFS: Record<
  AmbientPresetName,
  Omit<ResolvedAmbient, 'count' | 'opacity' | 'drift' | 'glow' | 'parallax'> & {
    count?: number;
    opacity?: number;
    drift?: number;
    glow?: boolean;
    parallax?: number;
  }
> = {
  // Dev-tool flavor (matches StepTimeline v3.1). VS Code blue + Figma orange
  // anchor the field; everything else stays faded monochrome.
  devtools: {
    icons: [Code2, Terminal, GitBranch, Github, Figma, Boxes, Cpu, Cloud],
    accentColors: { 0: '#007ACC', 4: '#F24E1E' },
    parallax: 22,
  },
  // Knowledge-work icons — used by TitleSlide hero historically.
  productivity: {
    icons: [FileText, Video, MessageSquare, Clipboard, UserCheck, Book, GitBranch, Users],
  },
  // Strategy / ops — was the StepTimeline icon set before v0.29.
  process: {
    icons: [Compass, Target, Hammer, TrendingUp, Workflow, Layers, Activity, Sparkles],
  },
  // Whisper layer — almost invisible. Use for slides that just need
  // a hint of life without competing for attention.
  minimal: {
    icons: [Sparkles],
    count: 6,
    opacity: 0.03,
    drift: 0.25,
  },
};

const DEFAULTS = {
  count: 14,
  opacity: 0.05,
  drift: 0.4,
  glow: false,
  parallax: 18,
};

/**
 * Resolve the slide's `ambientBackground` field to concrete props for
 * `<AmbientBackground>`. Returns `null` when the slide opts out (`false`)
 * or omits the field entirely.
 */
export function resolveAmbient(
  field: AmbientPresetName | AmbientBackgroundSpec | false | undefined,
): ResolvedAmbient | null {
  if (!field) return null;
  // String shorthand: just a preset name.
  if (typeof field === 'string') {
    const def = PRESET_DEFS[field];
    if (!def) return null;
    return { ...DEFAULTS, ...def };
  }
  // Object form: optionally seeded from a preset, then overrides applied.
  const base: Partial<ResolvedAmbient> = field.preset ? PRESET_DEFS[field.preset] : {};
  return {
    ...DEFAULTS,
    ...base,
    ...(field.count    !== undefined ? { count:    field.count }    : {}),
    ...(field.opacity  !== undefined ? { opacity:  field.opacity }  : {}),
    ...(field.drift    !== undefined ? { drift:    field.drift }    : {}),
    ...(field.glow     !== undefined ? { glow:     field.glow }     : {}),
    ...(field.parallax !== undefined ? { parallax: field.parallax } : {}),
    icons: base.icons ?? PRESET_DEFS.productivity.icons,
    accentColors: base.accentColors,
  };
}
