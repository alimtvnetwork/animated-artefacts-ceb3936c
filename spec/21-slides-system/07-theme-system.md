# 07 — Theme System

The deck now ships with **10 preset palettes** plus imported custom themes. The
presenter switches between them live from the controller pill (palette icon,
next to fullscreen) or `/theme-preview`. The active choice persists in
`localStorage` under `riseup.theme.v1`, is also pinned per deck in
`riseup.theme.byDeck.v1`, and is **stamped into every manifest export**
(`deck.theme`) so the receiving project shows the deck the way the author saw it.

## Available themes

| id             | label          | accent    | text/cream | mood |
|----------------|----------------|-----------|------------|------|
| `noir-gold`    | Noir & Gold    | `#C9A84C` | `#F0D78C`  | Original. Restrained, antique, magazine-editorial. |
| `bright-gold`  | Bright Gold    | `#f3a502` | `#fff1d6`  | Updated default. Vivid, high contrast, presentation-floor energy. |
| `vscode-dark`  | VS Code Dark+  | `#007acc` | `#d4d4d4`  | Microsoft editor classic — azure on `#1e1e1e`. |
| `dracula`      | Dracula        | `#bd93f9` | `#f8f8f2`  | Cult favourite — purple + pink on `#282a36`. |
| `monokai`      | Monokai        | `#a6e22e` | `#f8f8f2`  | Sublime/TextMate — vivid green + orange on `#272822`. |
| `github-light` | GitHub Light   | `#0969da` | `#1f2328`  | Light mode editorial — clean, web-native. |
| `paper-ink`    | Paper & Ink    | `#8A5A0E` | `#1F1A12`  | Warm cream paper, espresso ink, print/daytime-friendly. |
| `macos-sonoma` | macOS Sonoma   | `#007aff` | `#f5f5f7`  | Apple desktop — system blue on indigo gradient. |
| `windows-11`   | Windows 11     | `#60cdff` | `#ffffff`  | Fluent design — mica neutral with accent blue. |
| `navy-blue`    | Navy Blue      | `#06b6d4` | `#f1f5f9`  | Editorial navy + cyan/orange, optional font swap. |

Most themes keep the house Ubuntu/Inter typography; `navy-blue` demonstrates
optional `fonts.display` / `fonts.body` / `fonts.mono` overrides. Exact token
patches live in `src/slides/themes.ts`; import/export and custom theme storage
live in `src/slides/themeManifest.ts`.

## How it works

1. `registerCustomThemesOnBoot()` runs before first paint so imported custom
   theme ids exist in memory before initial resolution.
2. `applyTheme(id)` writes a `data-theme` attribute on `<html>` and patches the
   union of all theme-declared CSS variables on `:root`, including core tokens
   such as:
   - `--background`, `--foreground`, `--muted-foreground`, `--border`
   - `--primary`, `--primary-foreground`, `--ring`
   - `--gold`, `--gold-glow`, `--ember`, `--cream`, `--ink`
   - `--surface-1`, `--surface-2`, `--surface-3`
   - `--gradient-noir` and any theme-specific gradient/capsule/chart tokens
3. Optional theme `fonts` are written into `--preset-display-font`,
   `--preset-body-font`, and `--preset-mono-font`.
4. The saved brightness offset (`riseup.theme.brightness.v1`) is re-applied
   after every theme switch so `--gold` / `--gold-glow` remain user-tuned.
5. Components consume those tokens via semantic classes / `hsl(var(--token))`
   so the swap is instant, global, and never requires re-rendering React.
6. `src/main.tsx` calls `applyTheme(getInitialTheme(deckTheme, activeDeckSlug))`
   before `createRoot`, so first paint is already on the correct palette.

## Manifest round-trip

- **Deck export:** `buildManifest()` reads the active theme via `getStoredTheme()`
  and writes it into `deck.theme`. Pass `themeId` explicitly to override.
- **Deck import:** `DeckMenu.handleFile()` calls `setTheme(manifestTheme(m))`
  before persisting + reloading, so the post-reload page already renders in
  the imported palette.
- **Theme export/import:** `buildThemeManifest()` / `parseThemeManifest()` /
  `installThemeManifest()` provide the single-theme portability path.
- **Validation/fallback:** unknown theme ids fall back safely via
  `coerceThemeId()` instead of crashing.
- **Collision handling:** imported themes cannot shadow built-ins; collisions
  auto-suffix (`-imported`, `-imported-2`, etc.).

## Authoring rules

- Never hard-code `#f3a502` or `#C9A84C` in a component. Always go through
  `hsl(var(--gold))`. Hard-coded brand colors break theme switching silently.
- Capsule, controller-pill, shadow, and shimmer styles already use the tokens
  — new components must follow the same rule.
- Light themes must preserve readable capsule contrast through the existing
  `.capsule-{tone}` classes; never bypass them with inline token styles.
- Shared preset overlays may live in `front-end/themes/<id>/colors.json` and
  `front-end/themes/<id>/themes.json`; they layer onto matching built-ins at
  module init.
- When adding a new built-in theme: append it to `THEMES` in `src/slides/themes.ts`,
  add its id to the `theme` enum in `deck.schema.json` if required, and update this file.
