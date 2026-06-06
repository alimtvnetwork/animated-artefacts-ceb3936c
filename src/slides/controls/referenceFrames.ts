import glasswingFrame from '@/assets/reference-themes/01-sample.webp';
import thinkYellowFrame from '@/assets/reference-themes/02-sample.webp';
import riseupProFrame from '@/assets/reference-themes/03-sample.jpg';
import type { ThemeId } from '../themes';

/**
 * Maps the three image-derived themes to the presenter reference frame they
 * were sampled from. Other themes have no frame.
 * Source mapping: spec/21-slides-system/08-image-derived-themes.md §Stored.
 */
const FRAMES: Partial<Record<ThemeId, string>> = {
  glasswing: glasswingFrame,
  'think-yellow': thinkYellowFrame,
  'riseup-pro': riseupProFrame,
};

export function getReferenceFrame(id: ThemeId): string | undefined {
  return FRAMES[id];
}
