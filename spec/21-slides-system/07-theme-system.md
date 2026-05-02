# 07 — Theme System

The deck ships with two preset palettes. The presenter switches between them
live from the controller pill (palette icon, next to fullscreen). The active
choice persists in `localStorage` under `riseup.theme.v1` and is **stamped
into every manifest export** (`deck.theme`) so the receiving project shows the
deck the way the author saw it.

## Available themes

| id             | label          | accent    | text/cream | mood |
|----------------|----------------|-----------|------------|------|
| `noir-gold`    | Noir & Gold    | `#C9A84C` | `#F0D78C`  | Original. Restrained, antique, magazine-editorial. |
| `bright-gold`  | Bright Gold    | `#f3a502` | `#fff1d6`  | Updated default. Vivid, high contrast, presentation-floor energy. |
| `vscode-dark`  | VS Code Dark+  | `#007acc` | `#d4d4d4`  | Microsoft editor classic — azure on `#1e1e1e`. |
| `dracula`      | Dracula        | `#bd93f9` | `#f8f8f2`  | Cult favourite — purple + pink on `#282a36`. |
| `monokai`      | Monokai        | `#a6e22e` | `#f8f8f2`  | Sublime/TextMate — vivid green + orange on `#272822`. |
| `github-light` | GitHub Light   | `#0969da` | `#1f2328`  | Light mode editorial — clean, web-native. |
| `macos-sonoma` | macOS Sonoma   | `#007aff` | `#f5f5f7`  | Apple desktop — system blue on indigo gradient. |
| `windows-11`   | Windows 11     | `#60cdff` | `#ffffff`  | Fluent design — mica neutral with accent blue. |

All themes share the same Ubuntu/Inter typography and capsule shapes. Only the
brand-color HSL triplets and `--gradient-noir` background differ — see
`src/slides/themes.ts` for the exact overrides per theme.

## How it works

1. `applyTheme(id)` writes a `data-theme` attribute on `<html>` and patches the
   following CSS variables on `:root`:
   - `--gold`, `--gold-glow`, `--cream`
   - `--primary`, `--ring`, `--foreground`, `--muted-foreground`, `--border`
   - `--gradient-noir`
2. Components consume those tokens via `hsl(var(--token))` — so the swap is
   instant, global, and never requires re-rendering React.
3. `src/main.tsx` calls `applyTheme(getStoredTheme())` before `createRoot`
   so the first paint is already on the correct palette (no flash of the
   wrong palette on hard refresh).

## Manifest round-trip

- **Export:** `buildManifest()` reads the active theme via `getStoredTheme()`
  and writes it into `deck.theme`. Pass `themeId` explicitly to override.
- **Import:** `DeckMenu.handleFile()` calls `setTheme(manifestTheme(m))`
  before persisting + reloading, so the post-reload page already renders in
  the imported palette.
- **Validation:** `deck.schema.json` restricts `theme` to the known ids
  (`noir-gold` | `bright-gold`). Unknown ids fall back to the system default
  via `coerceThemeId()` rather than crashing.

## Authoring rules

- Never hard-code `#f3a502` or `#C9A84C` in a component. Always go through
  `hsl(var(--gold))`. Hard-coded brand colors break theme switching silently.
- Capsule, controller-pill, shadow, and shimmer styles already use the tokens
  — new components must follow the same rule.
- When adding a new theme: append it to `THEMES` in `src/slides/themes.ts`,
  add its id to the `theme` enum in `deck.schema.json`, and update this file.
