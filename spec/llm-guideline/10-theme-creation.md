# 10 — Theme creation, import & export

How any LLM (or human) authors a **palette/theme** for this deck, and how
themes move between projects as JSON. Companion to the slide-authoring guide
in `LLM.md`. Themes are pure JSON — no code changes are needed to add one.

---

## 1. What a theme is

A theme is a named palette + typography/surface tokens applied at runtime.
Built-in themes live in `front-end/themes/<theme-name>/` as:

```
front-end/themes/<name>/
├── themes.json    # metadata: id, label, appearance (dark|light)
└── colors.json    # the token values (HSL triplets, no `hsl()` wrapper)
```

Custom (imported) themes are stored in the browser under
`localStorage["riseup.themes.custom.v1"]` and registered on boot
(`src/slides/themeManifest.ts` → `registerCustomThemesOnBoot`).

### Token rules (do not break)

- Every color is an **HSL triplet string** — `"42 56% 54%"` — NOT
  `hsl(42 56% 54%)` and NOT hex. The renderer wraps it in `hsl(var(--token))`.
- Provide both **dark and light** legibility: set `appearance` correctly so
  capsules and text flip safely. On light themes the brand tokens
  (`--gold/--ember/--cream/--white/--ink`) are repurposed — never hand-author
  inline chip colors; capsules always use `.capsule-{tone}` classes.
- Keep the required token set complete (background, foreground, primary,
  muted, accent, gold, ember, cream, ink, border, …). Missing tokens fall
  back and usually look broken.

---

## 2. Single-theme manifest (one theme = one JSON file)

Export/import shape (`src/slides/themeManifest.ts`):

```jsonc
{
  "themeManifestVersion": 1,
  "exportedAt": "2026-06-06T00:00:00Z",
  "source": "showcase",
  "theme": {
    "id": "midnight-ember",
    "label": "Midnight Ember",
    "appearance": "dark",
    "colors": { "background": "0 0% 5%", "gold": "42 56% 54%", "...": "..." }
  }
}
```

- **Export** the active theme: controller → **Import / Export → Export theme
  (single/active)** (`downloadThemeManifest`).
- **Import** a single theme: **Import theme (single)** → validates with
  `parseThemeManifest`, installs via `installThemeManifest`, and the palette
  becomes selectable immediately.

## 3. Multiple themes in one file (theme bundle)

For shipping a whole palette set at once (`src/slides/themeBulk.ts`):

```jsonc
{
  "themeBundleVersion": 1,
  "exportedAt": "2026-06-06T00:00:00Z",
  "themes": [ { /* SerializableTheme */ }, { /* … */ } ]
}
```

- **Export all** custom themes: **Import / Export → Export themes (all)**
  (`exportAllThemes`).
- **Import all**: **Import themes (all)** → `parseThemeBundle` +
  `installAllThemes` (returns how many installed).
- The **ZIP bundle** (`Export ZIP (deck + themes)`) packs the deck manifest
  AND the theme bundle together for a complete handoff.

---

## 4. Authoring a new theme from scratch (recipe)

1. Pick a topic-appropriate palette (one dominant color, 1–2 supports, one
   sharp accent). Convert each to an HSL triplet string.
2. Copy an existing `front-end/themes/<name>/colors.json` as a template and
   replace values; keep every key.
3. Set `themes.json` → `{ id, label, appearance }`. `id` must be unique and
   kebab-case.
4. To distribute, wrap it as a single-theme manifest (section 2) or add it to
   a bundle (section 3) and hand over the one JSON file.

---

## 5. Golden rules

1. HSL triplets only — never hex, never `hsl()` wrapper.
2. Set `appearance` honestly (dark|light) so contrast flips work.
3. Capsules use `.capsule-{tone}` classes; never inline brand-token colors.
4. Keep the full token set — partial palettes render broken.
5. One theme → single-theme manifest; many themes → bundle; deck+themes → ZIP.
