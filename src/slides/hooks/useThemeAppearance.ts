/**
 * useThemeAppearance — observe the active theme's `appearance` ('light' | 'dark').
 *
 * The runtime theme switcher writes `data-theme="<id>"` onto `<html>` (see
 * `applyTheme` in `src/slides/themes.ts`). This hook subscribes to that
 * attribute via MutationObserver and resolves the active preset's
 * `appearance` field — defaulting to `'dark'` (the deck's house style).
 *
 * Use this when an asset must swap to maintain contrast against the page
 * background — e.g. the RiseupAsia wordmark needs the dark version on
 * light themes and the light version on dark themes. See `BrandLogo`.
 */
import { useEffect, useState } from 'react';
import { THEMES, DEFAULT_THEME, type ThemeId } from '../themes';

export type ThemeAppearance = 'light' | 'dark';

function readAppearance(): ThemeAppearance {
  if (typeof document === 'undefined') return 'dark';
  const id = (document.documentElement.getAttribute('data-theme') ?? DEFAULT_THEME) as ThemeId;
  return THEMES[id]?.appearance ?? 'dark';
}

export function useThemeAppearance(): ThemeAppearance {
  const [appearance, setAppearance] = useState<ThemeAppearance>(readAppearance);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    // Sync once on mount in case SSR/hydration produced a stale value.
    setAppearance(readAppearance());
    const obs = new MutationObserver(() => setAppearance(readAppearance()));
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  return appearance;
}
