/**
 * Theme system for the deck.
 *
 * Two themes ship today:
 * - `noir-gold` — the original, restrained palette (gold #C9A84C + soft cream #F0D78C).
 * - `bright-gold` — the updated, higher-energy palette (gold #f3a502 + near-white cream #fff1d6).
 *
 * Themes are applied by setting a `data-theme` attribute on `<html>`. Each theme
 * provides a small set of HSL-triplet overrides for the brand tokens; everything
 * else (component styles, capsules, controller pill) reads through these
 * variables, so swapping themes is instant and global.
 *
 * Authoring rule: when a deck is exported, the active theme id is written into
 * the manifest's `deck.theme` field. On import, the importer applies that theme
 * automatically so the receiver sees the deck the way the author saw it.
 */

export type ThemeId =
  | 'noir-gold'
  | 'bright-gold'
  | 'vscode-dark'
  | 'dracula'
  | 'monokai'
  | 'github-light'
  | 'paper-ink'
  | 'macos-sonoma'
  | 'windows-11'
  | 'navy-blue'
  | 'glasswing'
  | 'think-yellow'
  | 'riseup-pro';

export interface ThemePreset {
  id: ThemeId;
  label: string;
  description: string;
  /** Swatch colors for the picker UI, in display order. */
  swatch: string[];
  /**
   * Visual appearance class — drives automatic asset swaps that need to
   * contrast the page background (e.g. the brand logo: dark wordmark on
   * light themes, light wordmark on dark themes). Default `'dark'`.
   * See `useThemeAppearance()` and `BrandLogo`.
   */
  appearance?: 'light' | 'dark';
  /** HSL-triplet overrides applied to `:root` when this theme is active. */
  vars: Record<string, string>;
  /**
   * Optional per-theme font-family overrides. When set, written into
   * `--preset-display-font` / `--preset-body-font` / `--preset-mono-font` on
   * `:root` so utility classes (`.slide-title-display`, `.slide-codeblock`,
   * `.slide-table`, etc.) can swap font stacks without touching markup.
   *
   * Each value should be a complete `font-family` declaration including
   * fallbacks, e.g. `"Poppins, Inter, sans-serif"`.
   *
   * v0.169 — introduced for the `navy-blue` theme so it can adopt
   * Poppins/JetBrains Mono while other themes keep Ubuntu/Inter. Other
   * themes simply omit this block and the global defaults from `index.css`
   * remain in effect — i.e. **house style is the default**, font swaps are
   * strictly opt-in.
   */
  fonts?: {
    display?: string;
    body?: string;
    mono?: string;
  };
}

export const THEMES: Record<ThemeId, ThemePreset> = {
  // Original Noir-Gold — the palette the deck shipped with before the brightness bump.
  'noir-gold': {
    id: 'noir-gold',
    label: 'Noir & Gold',
    description: 'Original, restrained — soft cream titles, antique gold accents.',
    swatch: ['#0D0D0D', '#C9A84C', '#F0D78C', '#E85D3A'],
    vars: {
      '--gold': '43 56% 54%',           // #C9A84C
      '--gold-glow': '43 80% 70%',
      '--cream': '40 75% 84%',          // #F0D78C
      '--primary': '43 56% 54%',
      '--ring': '43 56% 54%',
      '--foreground': '40 70% 90%',
      '--muted-foreground': '40 25% 70%',
      '--border': '43 25% 22%',
      '--gradient-noir': 'radial-gradient(ellipse at top, hsl(43 30% 9%) 0%, hsl(0 0% 5%) 60%)',
    },
  },

  // Updated bright palette — the current default since the recent refresh.
  'bright-gold': {
    id: 'bright-gold',
    label: 'Bright Gold',
    description: 'Updated — vivid #ffd166 gold (+15% brighter), near-white cream titles, max contrast.',
    swatch: ['#0D0D0D', '#ffd166', '#fff1d6', '#E85D3A'],
    vars: {
      '--gold': '42 100% 68%',          // ~#ffd166 — +10pp L over prior 58 per 2026-05-16 "+15% brighter" request
      '--gold-glow': '44 100% 80%',     // lifted in step with --gold
      '--cream': '42 100% 94%',         // #fff1d6
      '--primary': '42 100% 68%',
      '--ring': '42 100% 68%',
      '--foreground': '42 100% 96%',
      '--muted-foreground': '42 25% 75%',
      '--border': '42 25% 22%',
      // 2026-05-16 (v3): user said the ambient still read brown, not gold. Shifted the
      // hotspot toward a cleaner yellow-gold hue (47–49), raised saturation across the
      // visible band, and widened the spread so slide 1 reads as gold-lit noir rather
      // than sepia. Keep the outer falloff dark enough to preserve the premium deck mood.
      '--gradient-noir': 'radial-gradient(ellipse 118% 82% at 50% -8%, hsl(49 100% 44%) 0%, hsl(47 96% 30%) 22%, hsl(44 82% 17%) 46%, hsl(40 24% 7%) 76%, hsl(0 0% 4%) 100%)',
    },
  },
  // ─── VS Code Dark+ — the classic Microsoft editor palette (blue accent on near-black). ───
  'vscode-dark': {
    id: 'vscode-dark',
    label: 'VS Code Dark+',
    description: 'Microsoft editor classic — #1e1e1e bg, #007acc azure accent, #d4d4d4 text.',
    swatch: ['#1e1e1e', '#007acc', '#d4d4d4', '#c586c0'],
    vars: {
      // WCAG AA fix (2026-05-01): bumped --gold L 40→50 so the
      // capsule-gold gradient's worst stop clears 4.5:1 ink contrast.
      // Original azure (#007acc) was below AA when used as a solid bg.
      '--gold': '207 100% 50%',         // azure (was #007acc, lifted for AA)
      '--gold-glow': '207 100% 60%',
      '--cream': '0 0% 83%',            // #d4d4d4
      '--primary': '207 100% 40%',
      '--ring': '207 100% 40%',
      '--foreground': '0 0% 90%',
      '--muted-foreground': '0 0% 60%',
      '--border': '0 0% 20%',
      '--gradient-noir': 'radial-gradient(ellipse at top, hsl(207 30% 12%) 0%, hsl(0 0% 12%) 60%)',
    },
  },

  // ─── Dracula — beloved purple-on-dark palette from draculatheme.com. ───
  'dracula': {
    id: 'dracula',
    label: 'Dracula',
    description: 'Cult-favourite dark theme — #282a36 bg, #bd93f9 purple, #ff79c6 pink accents.',
    swatch: ['#282a36', '#bd93f9', '#ff79c6', '#50fa7b'],
    vars: {
      '--gold': '265 89% 78%',          // #bd93f9
      '--gold-glow': '326 100% 74%',    // #ff79c6
      '--cream': '60 30% 96%',          // #f8f8f2
      '--primary': '265 89% 78%',
      '--ring': '265 89% 78%',
      '--foreground': '60 30% 96%',
      '--muted-foreground': '225 27% 70%', // #6272a4-ish lighter
      '--border': '232 14% 31%',
      '--gradient-noir': 'radial-gradient(ellipse at top, hsl(232 14% 22%) 0%, hsl(231 15% 18%) 60%)',
    },
  },

  // ─── Monokai — Sublime/TextMate's high-contrast warm palette. ───
  'monokai': {
    id: 'monokai',
    label: 'Monokai',
    description: 'Sublime Text classic — #272822 bg, vivid #a6e22e green and #fd971f orange.',
    swatch: ['#272822', '#a6e22e', '#fd971f', '#f92672'],
    vars: {
      '--gold': '80 76% 53%',           // #a6e22e green
      '--gold-glow': '28 98% 55%',      // #fd971f orange-glow
      '--cream': '60 30% 96%',          // #f8f8f2
      '--primary': '80 76% 53%',
      '--ring': '80 76% 53%',
      '--foreground': '60 30% 96%',
      '--muted-foreground': '60 8% 65%',
      '--border': '70 8% 25%',
      '--gradient-noir': 'radial-gradient(ellipse at top, hsl(70 8% 18%) 0%, hsl(70 8% 14%) 60%)',
    },
  },

  // ─── GitHub Light — clean light mode used by github.com. ───
  'github-light': {
    id: 'github-light',
    label: 'GitHub Light',
    description: 'Clean editorial light mode — #ffffff bg, #0969da blue, #1f2328 ink.',
    appearance: 'light',
    swatch: ['#ffffff', '#0969da', '#1f2328', '#cf222e'],
    vars: {
      '--background': '212 40% 97%',    // soft cool-blue wash (#f1f5fa) — never pure #fff per spec/architecture/light-theme-bg.md
      '--card': '0 0% 100%',
      '--card-foreground': '210 12% 16%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '210 12% 16%',
      '--secondary': '210 17% 95%',
      '--secondary-foreground': '210 12% 16%',
      '--muted': '210 17% 95%',
      '--accent': '355 72% 47%',        // #cf222e
      '--accent-foreground': '0 0% 100%',
      '--input': '210 18% 87%',
      '--gold': '212 92% 45%',          // #0969da
      '--gold-glow': '212 92% 55%',
      '--ember': '355 72% 47%',         // #cf222e
      '--cream': '210 12% 16%',         // #1f2328 — used as title color on light bg
      '--primary': '212 92% 45%',
      '--primary-foreground': '0 0% 100%',
      '--ring': '212 92% 45%',
      '--foreground': '210 12% 16%',
      '--muted-foreground': '215 14% 34%',
      '--border': '210 18% 87%',
      '--surface-1': '0 0% 100%',
      '--surface-2': '210 17% 95%',
      '--surface-3': '210 16% 90%',
      '--ink': '210 12% 16%',
      '--gradient-noir': 'radial-gradient(ellipse at top, hsl(210 30% 98%) 0%, hsl(0 0% 100%) 60%)',
    },
  },

  // ─── Paper & Ink — warm cream paper, espresso ink, brand gold retained.
  // Distinct from `github-light` (cool blue wash + GitHub blue accent):
  // this is the daytime mode that **keeps the Riseup gold**, so the deck
  // still feels on-brand in bright rooms or printed handouts. Bg is a
  // warm cream (#FAF6EC) — never pure white per spec/architecture/light-theme-bg.md.
  // Accent is the same #f3a502 gold from `bright-gold`, but darkened slightly
  // for AA contrast on cream. Ink is a deep espresso (#1F1A12) for warmth.
  'paper-ink': {
    id: 'paper-ink',
    label: 'Paper & Ink',
    description: 'Warm cream paper, espresso ink, brand gold retained — daytime / print-friendly.',
    appearance: 'light',
    swatch: ['#FAF6EC', '#8A5A0E', '#1F1A12', '#C04A24'],
    vars: {
      '--background': '42 60% 95%',     // #FAF6EC warm cream
      '--card': '40 50% 98%',           // slightly brighter cream
      '--card-foreground': '36 25% 12%',
      '--popover': '40 50% 98%',
      '--popover-foreground': '36 25% 12%',
      '--secondary': '40 35% 90%',
      '--secondary-foreground': '36 25% 12%',
      '--muted': '40 35% 90%',
      '--accent': '14 70% 45%',         // #C04A24 ember, darkened for AA
      '--accent-foreground': '40 50% 98%',
      '--input': '40 25% 82%',
      '--gold': '38 80% 30%',           // #8A5A0E — brand gold darkened to clear AA (4.5:1) on cream bg
      '--gold-glow': '40 96% 48%',      // original #f3a502 glow
      '--ember': '14 70% 45%',          // #C04A24
      '--cream': '36 25% 12%',          // #1F1A12 espresso ink — used as title color on light bg
      '--primary': '38 80% 30%',
      '--primary-foreground': '40 50% 98%',
      '--ring': '38 80% 30%',
      '--foreground': '36 25% 12%',
      '--muted-foreground': '36 18% 32%',
      '--border': '40 25% 82%',
      '--surface-1': '40 50% 98%',
      '--surface-2': '40 35% 90%',
      '--surface-3': '40 30% 86%',
      '--ink': '36 25% 12%',
      '--gradient-noir': 'radial-gradient(ellipse at top, hsl(42 70% 97%) 0%, hsl(42 60% 95%) 60%)',
    },
  },
  'macos-sonoma': {
    id: 'macos-sonoma',
    label: 'macOS Sonoma',
    description: 'Apple desktop vibe — deep indigo gradient bg, #007aff system blue accents.',
    swatch: ['#1c1c1e', '#007aff', '#f5f5f7', '#ff9f0a'],
    vars: {
      // --gold stays at 212 100% 50% — that's the brand system-blue used on
      // eyebrows / step-labels / hero text where contrast on dark bg matters.
      // The solid-capsule-gold recipe (white-on-gold, fails AA at L=50)
      // gets its own darker override in index.css under
      // `[data-theme='macos-sonoma'] .capsule-gold`.
      '--gold': '212 100% 50%',         // #007aff iOS/macOS system blue
      '--gold-glow': '34 100% 52%',     // #ff9f0a system orange
      // WCAG AA fix (2026-05-01): override --ember L 57→45 so the solid
      // ember capsule (white text) clears 4.5:1 on the macOS palette.
      '--ember': '14 80% 45%',
      '--cream': '240 7% 97%',          // #f5f5f7
      '--primary': '212 100% 50%',
      '--ring': '212 100% 50%',
      '--foreground': '240 7% 97%',
      '--muted-foreground': '240 5% 70%',
      '--border': '240 6% 25%',
      '--gradient-noir': 'radial-gradient(ellipse at top, hsl(240 25% 18%) 0%, hsl(240 10% 11%) 60%)',
    },
  },

  // ─── Windows 11 — Microsoft's Fluent acrylic with mica-ish neutrals. ───
  'windows-11': {
    id: 'windows-11',
    label: 'Windows 11',
    description: 'Fluent design — mica neutral bg, #60cdff accent blue, rounded modern feel.',
    swatch: ['#202020', '#60cdff', '#ffffff', '#0078d4'],
    vars: {
      '--gold': '199 100% 69%',         // #60cdff Fluent accent
      // WCAG AA fix (2026-05-01): bumped --gold-glow L 42→50 so the
      // capsule-gold gradient's worst stop clears 4.5:1 ink contrast.
      '--gold-glow': '206 100% 50%',    // deeper Fluent accent, AA-tuned
      '--cream': '0 0% 100%',
      '--primary': '199 100% 69%',
      '--ring': '199 100% 69%',
      '--foreground': '0 0% 96%',
      '--muted-foreground': '0 0% 70%',
      '--border': '0 0% 22%',
      '--gradient-noir': 'radial-gradient(ellipse at top, hsl(210 15% 16%) 0%, hsl(0 0% 12%) 60%)',
    },
  },

  // ─── Navy Blue — deep navy primary, cyan + orange accents. Editorial / data-deck feel.
  // Inspired by an external "presentation design system" doc — uses Poppins for body,
  // JetBrains Mono for code, while keeping Ubuntu for display headlines.
  // Palette: navy #1a2840 bg, cyan #06b6d4 accent, orange #f59e0b accent-2.
  'navy-blue': {
    id: 'navy-blue',
    label: 'Navy Blue',
    description: 'Editorial navy + cyan + orange — Poppins body, JetBrains Mono code, ER-diagram ready.',
    swatch: ['#1a2840', '#06b6d4', '#f59e0b', '#f1f5f9'],
    vars: {
      // Map our token shape onto the navy/cyan/orange system.
      // `--gold` is the *primary accent* in the deck's contract — for navy-blue
      // that role is played by cyan.
      '--gold':              '188 95% 43%',         // cyan #06b6d4
      '--gold-glow':         '188 95% 55%',
      '--cream':             '210 40% 96%',         // near-white slate cream
      '--ember':             '32 95% 50%',          // orange #f59e0b — secondary accent
      '--primary':           '188 95% 43%',
      '--ring':              '188 95% 43%',
      '--background':        '222 35% 12%',         // deep navy
      '--foreground':        '210 40% 96%',
      '--muted-foreground':  '215 20% 70%',
      '--border':            '215 25% 28%',
      '--surface-1':         '222 30% 15%',
      '--surface-2':         '222 25% 19%',
      '--surface-3':         '222 22% 24%',
      '--ink':               '222 35% 10%',

      // Gradients — the "gold gradient" is reused on hero text and accents
      // across the deck. Retune cyan→orange so navy-blue feels native.
      '--gradient-noir':       'radial-gradient(ellipse at top, hsl(222 40% 18%) 0%, hsl(222 35% 10%) 60%)',
      '--gradient-gold':       'linear-gradient(135deg, hsl(188 95% 43%), hsl(32 95% 50%))',
      '--gradient-text-gold':  'linear-gradient(135deg, hsl(188 95% 60%), hsl(188 95% 43%) 50%, hsl(32 95% 50%))',

      // Capsule overrides (v0.177) — `gold` capsule becomes cyan, `ember`
      // stays orange but warmed for navy bg, `cream` reads as soft slate.
      // Outline gets a navy-tuned border so it doesn't look stranded.
      '--capsule-gold-bg':       '188 95% 43% / 0.18',
      '--capsule-gold-fg':       '188 95% 78%',
      '--capsule-gold-border':   '188 95% 43% / 0.55',
      '--capsule-ember-bg':      '32 95% 50% / 0.18',
      '--capsule-ember-fg':      '32 95% 72%',
      '--capsule-ember-border':  '32 95% 50% / 0.50',
      '--capsule-cream-bg':      '210 40% 96% / 0.10',
      '--capsule-cream-fg':      '210 40% 96%',
      '--capsule-cream-border':  '210 40% 96% / 0.35',
      '--capsule-ink-bg':        '222 35% 10% / 0.55',
      '--capsule-ink-fg':        '210 40% 96%',
      '--capsule-ink-border':    '215 25% 35% / 0.70',
      '--capsule-outline-bg':    '210 40% 96% / 0.03',
      '--capsule-outline-fg':    '210 40% 92%',
      '--capsule-outline-border':'215 25% 38%',

      // Chart palette (v0.177) — categorical 5-stop sequence picked from
      // the navy-blue brand: cyan, orange, sky, violet, mint. Order is
      // contrast-first so the first 2 series are always brand-on-brand.
      '--chart-1': '188 95% 43%',   // cyan (primary)
      '--chart-2': '32 95% 50%',    // orange (secondary)
      '--chart-3': '210 90% 70%',   // sky blue
      '--chart-4': '265 75% 70%',   // violet
      '--chart-5': '160 70% 55%',   // mint
    },
    fonts: {
      // Headlines stay Ubuntu so house-style display rhythm holds.
      display: 'Ubuntu, Inter, sans-serif',
      // Body switches to Poppins for the navy-blue editorial feel.
      body: 'Poppins, Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      // Code blocks + ER-box field types use JetBrains Mono.
      mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    },
  },
};

/**
 * Option C — overlay shared theme files from `front-end/themes/<id>/`.
 *
 * Per `spec/21-slides-system/architecture/architecture.md` §2.2, themes
 * live in `front-end/themes/<theme-id>/{themes,colors}.json`. We pick
 * those up at module-init and merge their tokens into the matching
 * `THEMES[id]` preset so a designer can retune the palette by editing
 * JSON only — no code change required.
 *
 * Cascade: built-in preset → `front-end/themes/<id>/colors.json` (HSL
 * triplets and `capsule.*` overrides) → `front-end/themes/<id>/themes.json`
 * (fontFamily → `preset.fonts`). Project-level overrides
 * (`front-end/project/<slug>/themes/`) will layer on top in a later phase.
 */
// `import.meta.glob` only exists under Vite (dev/build/Vitest). When this
// module is loaded by a bare Bun CLI script (e.g. `bun ./scripts/contrast-audit.ts`),
// the helper is undefined and the eager-glob throws. Fall back to an empty
// overlay map in that case — the contrast audit only needs the built-in
// presets, and CLI consumers that DO need external overlays can still get
// them via the Vitest entry point (`bunx vitest run deckContrastAudit`).
type GlobFn = (pattern: string, opts: { eager: true }) => Record<string, { default: Record<string, unknown> }>;
const viteGlob: GlobFn | undefined =
  typeof import.meta !== 'undefined' && (import.meta as { glob?: GlobFn }).glob
    ? (import.meta as { glob: GlobFn }).glob
    : undefined;
const externalColorModules = viteGlob
  ? viteGlob('../../front-end/themes/*/colors.json', { eager: true })
  : {};
const externalThemeModules = viteGlob
  ? viteGlob('../../front-end/themes/*/themes.json', { eager: true })
  : {};

function themeIdFromPath(path: string): string | null {
  const m = path.match(/front-end\/themes\/([^/]+)\/(?:colors|themes)\.json$/);
  return m ? m[1] : null;
}

(function applyExternalThemeOverlays() {
  for (const [path, mod] of Object.entries(externalColorModules)) {
    const id = themeIdFromPath(path);
    if (!id || !(id in THEMES)) continue;
    const preset = THEMES[id as ThemeId];
    const data = mod.default ?? {};
    const tokenMap: Record<string, string> = {
      background: '--background', foreground: '--foreground',
      primary: '--primary', accent: '--accent',
      gold: '--gold', goldGlow: '--gold-glow',
      ember: '--ember', cream: '--cream',
      ink: '--ink',
      surface1: '--surface-1', surface2: '--surface-2', surface3: '--surface-3',
      border: '--border', muted: '--muted', mutedForeground: '--muted-foreground',
    };
    for (const [k, v] of Object.entries(data)) {
      if (typeof v !== 'string') continue;
      const cssVar = tokenMap[k];
      // Only update vars the preset already declares — overlays must not
      // introduce *new* CSS variables, which would silently override
      // index.css defaults that other themes rely on (e.g. capsule.* and
      // surface vars). Edit the THEMES preset first if you want to
      // expose a new override surface.
      if (cssVar && cssVar in preset.vars) preset.vars[cssVar] = v;
    }
    const caps = (data as { capsule?: Record<string, Record<string, string>> }).capsule;
    if (caps && typeof caps === 'object') {
      for (const [name, parts] of Object.entries(caps)) {
        if (!parts || typeof parts !== 'object') continue;
        const bgKey = `--capsule-${name}-bg`;
        const fgKey = `--capsule-${name}-fg`;
        const brdKey = `--capsule-${name}-border`;
        if (typeof parts.bg === 'string'     && bgKey  in preset.vars) preset.vars[bgKey]  = parts.bg;
        if (typeof parts.fg === 'string'     && fgKey  in preset.vars) preset.vars[fgKey]  = parts.fg;
        if (typeof parts.border === 'string' && brdKey in preset.vars) preset.vars[brdKey] = parts.border;
      }
    }
  }
  for (const [path, mod] of Object.entries(externalThemeModules)) {
    const id = themeIdFromPath(path);
    if (!id || !(id in THEMES)) continue;
    const preset = THEMES[id as ThemeId];
    const data = mod.default ?? {};
    const ff = (data as { fontFamily?: { display?: string; body?: string; mono?: string } }).fontFamily;
    if (ff) {
      const fonts = preset.fonts ?? {};
      if (ff.display && !fonts.display) fonts.display = `${ff.display}, Inter, sans-serif`;
      if (ff.body    && !fonts.body)    fonts.body    = `${ff.body}, -apple-system, BlinkMacSystemFont, sans-serif`;
      if (ff.mono    && !fonts.mono)    fonts.mono    = ff.mono;
      preset.fonts = fonts;
    }
  }
})();

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
export const DEFAULT_THEME: ThemeId = 'bright-gold';
const STORAGE_KEY = 'riseup.theme.v1';
const THEME_VAR_KEYS = Array.from(
  new Set(Object.values(THEMES).flatMap((theme) => Object.keys(theme.vars))),
);
/** Per-deck theme persistence (slug → theme id). Survives across decks
 *  so re-opening deck X restores its last-active theme automatically,
 *  even if you've since switched themes inside deck Y. The single-slot
 *  `STORAGE_KEY` above remains the global fallback for fresh decks. */
const STORAGE_KEY_BY_DECK = 'riseup.theme.byDeck.v1';

/** Slug of the currently-loaded deck. Wired once at boot from main.tsx
 *  (loader → setActiveDeckSlug) so themes.ts never has to import the
 *  loader and create a cycle. Null = ignore per-deck persistence. */
let activeDeckSlug: string | null = null;

/** Register the active deck slug for per-deck theme persistence. Idempotent. */
export function setActiveDeckSlug(slug: string | null) {
  activeDeckSlug = slug && slug.length > 0 ? slug : null;
}

/** Read the per-deck theme map from localStorage. Resilient to corrupt JSON. */
function readDeckThemeMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_BY_DECK);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function writeDeckThemeMap(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_BY_DECK, JSON.stringify(map));
  } catch {
    /* quota / privacy mode — non-fatal, global slot still wins. */
  }
}

/** Read the global saved theme. */
export function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && saved in THEMES) return saved as ThemeId;
  return DEFAULT_THEME;
}

/** Read the theme last activated inside a specific deck, if any. */
export function getStoredThemeForDeck(slug: string | null | undefined): ThemeId | null {
  if (!slug || typeof window === 'undefined') return null;
  const map = readDeckThemeMap();
  const id = map[slug];
  return id && id in THEMES ? (id as ThemeId) : null;
}

/**
 * v0.172 — `?theme=<id>` URL override. Returns the theme id when the
 * current URL carries a `?theme=` param matching a known theme, else `null`.
 * Deliberately does NOT touch localStorage so the override stays
 * session-only and shareable links (e.g. `/3?theme=github-light`) preview
 * a theme without changing the user's saved preference.
 */
export function getUrlThemeOverride(): ThemeId | null {
  if (typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('theme');
  if (!param) return null;
  return param in THEMES ? (param as ThemeId) : null;
}

/**
 * v0.173 — `?testMode=1` URL flag. When set, the deck must boot from a
 * deterministic source (the deck-declared theme) and IGNORE localStorage
 * entirely. This makes screenshot diffs, contrast audits, and shared
 * preview URLs fully reproducible across machines/sessions.
 *
 * Truthy values: `1`, `true`, `yes`, `on` (case-insensitive). Anything
 * else — including absent — returns false.
 */
export function isTestMode(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = new URLSearchParams(window.location.search).get('testMode');
  if (raw == null) return false;
  return /^(1|true|yes|on)$/i.test(raw);
}

/**
 * Boot resolution. Priority (highest first):
 *   1. `?theme=<id>` — explicit per-link override (session-only).
 *   2. `?testMode=1` + `deckTheme` — deterministic test boot from manifest.
 *   3. localStorage — user's saved preference.
 *   4. DEFAULT_THEME.
 *
 * `deckTheme` is passed in (rather than imported) to avoid creating a
 * `themes ↔ loader` import cycle. main.tsx wires it from `loader.deckTheme`.
 */
/**
 * Boot resolution. Priority (highest first):
 *   1. `?theme=<id>` — explicit per-link override (session-only).
 *   2. `?testMode=1` + `deckTheme` — deterministic test boot from manifest.
 *   3. **Per-deck saved theme** — last theme the user activated in THIS deck.
 *   4. Global localStorage — user's most recent preference across all decks.
 *   5. DEFAULT_THEME.
 *
 * `deckTheme` and `deckSlug` are passed in (rather than imported) to
 * avoid creating a `themes ↔ loader` import cycle. main.tsx wires them
 * from `loader.deckTheme` / `loader.activeDeckSlug`.
 */
export function getInitialTheme(
  deckTheme?: string | null,
  deckSlug?: string | null,
): ThemeId {
  const urlOverride = getUrlThemeOverride();
  if (urlOverride) return urlOverride;
  if (isTestMode() && deckTheme && deckTheme in THEMES) {
    return deckTheme as ThemeId;
  }
  // Per-deck pin wins over the global slot so re-opening deck X always
  // returns to its last-active theme regardless of where you've been since.
  const perDeck = getStoredThemeForDeck(deckSlug);
  if (perDeck) return perDeck;
  return getStoredTheme();
}

/** Persist the theme choice and apply it to the document root. Broadcasts to peer windows.
 *  v0.173 — under `?testMode=1` the localStorage write is suppressed so a
 *  reload always returns to the deck-declared theme. The visible apply +
 *  broadcast still fire so the picker UI feels responsive in-session.
 *
 *  In addition to the global slot, we also pin the choice against the
 *  active deck slug (if registered via setActiveDeckSlug) so each deck
 *  remembers its own last-used theme. */
export function setTheme(id: ThemeId, persist = true) {
  applyTheme(id);
  if (persist && typeof window !== 'undefined') {
    if (!isTestMode()) {
      window.localStorage.setItem(STORAGE_KEY, id);
      // Per-deck pin — only when we know which deck we're in.
      if (activeDeckSlug) {
        const map = readDeckThemeMap();
        if (map[activeDeckSlug] !== id) {
          map[activeDeckSlug] = id;
          writeDeckThemeMap(map);
        }
      }
    }
    // Notify any other open windows (presenter view) to re-apply.
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const ch = new BroadcastChannel('riseup-deck-sync');
        ch.postMessage({ type: 'theme', id });
        ch.close();
      }
    } catch { /* non-fatal */ }
  }
}

/** Apply theme variables to `:root` (does not persist). */
export function applyTheme(id: ThemeId) {
  if (typeof document === 'undefined') return;
  const preset = THEMES[id] ?? THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  root.setAttribute('data-theme', preset.id);
  for (const key of THEME_VAR_KEYS) root.style.removeProperty(key);
  for (const [k, v] of Object.entries(preset.vars)) {
    root.style.setProperty(k, v);
  }
  // v0.169 — per-theme font overrides. When the theme declares a `fonts`
  // block, write each entry into its `--preset-*-font` CSS variable so
  // utility classes (`.slide-title-display`, `.slide-codeblock`,
  // `.slide-table`, `.slide-card`) automatically swap stacks. When omitted,
  // we *clear* the variable so the previous theme's overrides don't bleed
  // through into the next one.
  const fontMap: Record<string, string | undefined> = {
    '--preset-display-font': preset.fonts?.display,
    '--preset-body-font':    preset.fonts?.body,
    '--preset-mono-font':    preset.fonts?.mono,
  };
  for (const [k, v] of Object.entries(fontMap)) {
    if (v) root.style.setProperty(k, v);
    else   root.style.removeProperty(k);
  }
  // Re-apply any stored gold-brightness offset on top of the freshly-written
  // preset vars (offset is preset-relative, so it has to run *after* the
  // base values land). See `applyBrightnessOffset`.
  applyBrightnessOffset(getStoredBrightnessOffset(), id);
}

/* ------------------------------------------------------------------ */
/* Gold-brightness offset — fine-tune the active theme's `--gold` /    */
/* `--gold-glow` lightness ±15pp without forking the preset.           */
/* ------------------------------------------------------------------ */

const STORAGE_KEY_BRIGHTNESS = 'riseup.theme.brightness.v1';
/** Maximum absolute offset, in HSL lightness percentage points. */
export const BRIGHTNESS_RANGE = 15;

function clampOffset(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(-BRIGHTNESS_RANGE, Math.min(BRIGHTNESS_RANGE, Math.round(n)));
}

/** Read the saved brightness offset (HSL lightness pp). 0 = preset default. */
export function getStoredBrightnessOffset(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY_BRIGHTNESS);
  if (raw == null) return 0;
  const n = Number.parseFloat(raw);
  return clampOffset(n);
}

/** Mutate `--gold` + `--gold-glow` on :root by `offset` pp (preset L + offset, clamped 0..100). */
export function applyBrightnessOffset(offset: number, id?: ThemeId) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const activeId = (id ?? (root.getAttribute('data-theme') as ThemeId | null)) ?? DEFAULT_THEME;
  const preset = THEMES[activeId] ?? THEMES[DEFAULT_THEME];
  const clamped = clampOffset(offset);
  const shift = (raw: string | undefined): string | null => {
    if (!raw) return null;
    const parsed = parseHslTriplet(raw);
    if (!parsed) return null;
    const newL = Math.max(0, Math.min(100, parsed.l + clamped));
    return `${parsed.h} ${parsed.s}% ${newL}%`;
  };
  const goldNext = shift(preset.vars['--gold']);
  const glowNext = shift(preset.vars['--gold-glow']);
  if (goldNext) root.style.setProperty('--gold', goldNext);
  if (glowNext) root.style.setProperty('--gold-glow', glowNext);
  // Re-derive capsule/ring/glow contrast tokens off the *effective* gold.
  // Keeps `.capsule-gold` readable across the full -15..+15 offset range
  // AND across theme switches (vscode-dark's blue, dracula's purple, etc).
  applyAutoContrast(goldNext ?? preset.vars['--gold']);
}

/* ------------------------------------------------------------------ */
/* Auto-contrast — derive --gold-on-* tokens from the effective gold   */
/* lightness so capsules, rings, and glows stay clean across themes    */
/* and brightness offsets. Runs after every applyTheme/brightness call.*/
/* ------------------------------------------------------------------ */

interface ContrastBand {
  fg: string;            // HSL triplet for capsule text
  borderAlpha: number;
  glowAlpha: number;
  sheenAlpha: number;    // inner top-edge highlight
}

const INK_FG = '0 0% 4%';
const CREAM_FG = '42 100% 94%';

function pickContrastBand(goldL: number): ContrastBand {
  // Below 42 — gold is dim ochre; ink text muddies. Flip to cream fg,
  // strengthen rim + glow so the chip still pops on noir.
  if (goldL < 42) return { fg: CREAM_FG, borderAlpha: 1.0,  glowAlpha: 0.62, sheenAlpha: 0.18 };
  // 42–55 — sweet spot; ink reads cleanly. Defaults.
  if (goldL < 55) return { fg: INK_FG,   borderAlpha: 0.92, glowAlpha: 0.55, sheenAlpha: 0.25 };
  // 55–70 — bright gold; ink contrast climbs. Soften rim/sheen so the chip
  // doesn't blow out into a flat slab.
  if (goldL < 70) return { fg: INK_FG,   borderAlpha: 0.85, glowAlpha: 0.48, sheenAlpha: 0.30 };
  // >=70 — near-yellow. Ink still wins for contrast; drop the rim further
  // and pull glow back so the chip stays a chip, not a beacon.
  return { fg: INK_FG, borderAlpha: 0.75, glowAlpha: 0.40, sheenAlpha: 0.34 };
}

/** Write `--gold-on-*` tokens from the effective gold's lightness. */
export function applyAutoContrast(effectiveGold: string | undefined) {
  if (typeof document === 'undefined' || !effectiveGold) return;
  const root = document.documentElement;
  const parsed = parseHslTriplet(effectiveGold);
  if (!parsed) return;
  const band = pickContrastBand(parsed.l);
  root.style.setProperty('--gold-on-fg', band.fg);
  root.style.setProperty('--gold-on-border-alpha', String(band.borderAlpha));
  root.style.setProperty('--gold-on-glow-alpha', String(band.glowAlpha));
  root.style.setProperty('--gold-on-sheen-alpha', String(band.sheenAlpha));
}

/** Live preview without persisting. Use during slider drag. */
export function previewBrightnessOffset(offset: number) {
  applyBrightnessOffset(offset);
}

/** Persist + apply. Use on slider commit / Apply button. */
export function setBrightnessOffset(offset: number) {
  const clamped = clampOffset(offset);
  if (typeof window !== 'undefined' && !isTestMode()) {
    if (clamped === 0) window.localStorage.removeItem(STORAGE_KEY_BRIGHTNESS);
    else window.localStorage.setItem(STORAGE_KEY_BRIGHTNESS, String(clamped));
  }
  applyBrightnessOffset(clamped);
}

/** Internal HSL triplet parser — local copy to avoid pulling ThemeMenu's. */
function parseHslTriplet(value: string): { h: number; s: number; l: number } | null {
  const m = value.trim().match(/^(-?\d*\.?\d+)\s+(-?\d*\.?\d+)%\s+(-?\d*\.?\d+)%$/);
  if (!m) return null;
  return { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]) };
}

/** Validate an unknown value as a ThemeId, returning DEFAULT_THEME if not. */
export function coerceThemeId(value: unknown): ThemeId {
  return typeof value === 'string' && value in THEMES ? (value as ThemeId) : DEFAULT_THEME;
}
