# Slides — System Architecture Spec

> Reference diagram: [`Slides.png`](./Slides.png)
> Source outline: [`Slides.md`](./Slides.md)

This document describes the **target folder structure** for the full Slides system, covering both the future PHP backend (`src/`) and the React + Canvas frontend (`front-end/`). The current Lovable project implements only a slice of `front-end/` — this spec is the canonical map for everything else as we grow.

> **Principle:** Adding/removing a JSON file changes what is rendered. No code changes required for content edits.

---

## Top-Level Layout

```
Slides/
├── src/              # PHP backend (future)
├── front-end/        # React + Canvas (current Lovable app lives here conceptually)
└── spec/             # Architecture & per-slide design specs
```

In the current Lovable project these folders are mirrored under the repo root as:

| Repo path                       | Spec path                       | Notes                          |
| ------------------------------- | ------------------------------- | ------------------------------ |
| `php/`                          | `src/` in diagram               | Empty placeholder for now      |
| `src/` (React)                  | `front-end/react+canvas`        | Active codebase                |
| `front-end/project/{name}/`     | `front-end/project/{name}/`     | Per-deck content + assets      |
| `front-end/themes/`             | `front-end/themes/`             | Shared themes (theme + colors) |
| `front-end/slide-template/`     | `front-end/slide-template/`     | Reusable slide templates       |
| `spec/`                         | `spec/`                         | This file + per-slide specs    |

---

## 1. PHP Backend — `php/src/`

Will host the API + persistence layer. Stays empty in the Lovable preview but the structure is reserved.

```
php/
└── src/
    ├── traits/                  # Reusable PHP traits
    ├── index.php                # Entry point / router
    ├── data/
    │   └── slides.db            # SQLite — decks, slides, themes, users
    └── authentication/
        ├── user                 # Auth: user identity
        └── password             # Auth: credential storage
```

**Responsibilities (planned):**
1. CRUD for decks, slides, themes via REST endpoints
2. Authentication (user / password)
3. Persisting `slides.json` and per-slide JSON files atomically
4. Serving the frontend's data folder

---

## 2. Frontend — `front-end/`

```
front-end/
├── project/
│   └── {project-name}/
│       ├── data/
│       │   ├── slides.json         # Deck manifest (Name, config, Slides[])
│       │   ├── slides/
│       │   │   └── 01-slide.json   # Per-slide payload
│       │   └── llmd.md             # Free-form notes for the LLM
│       ├── themes/
│       │   ├── themes.json         # Project-level theme override
│       │   └── colors.json         # Project-level color override
│       ├── assets/
│       │   ├── images/
│       │   ├── log/
│       │   └── svg/
│       └── spec/
│           └── 01-slide.md         # Per-slide human spec
│
├── themes/
│   └── {theme-name}/
│       ├── themes.json             # Shared theme tokens
│       └── colors.json             # Shared color palette
│
└── slide-template/
    └── {template-name}.json        # Template file
        # depends:
        #   - color.json
        #   - theme.json
```

### 2.1 Project Folder

Each presentation lives in its own `project/{project-name}/` folder. Everything that belongs to that deck — content, assets, theme overrides, specs — is co-located.

**`data/slides.json` (deck manifest):**

```json
{
  "Name": "Riseup Asia LLC — Showcase",
  "config": {
    "theme": "noir-gold",
    "controllerPosition": "BottomCenter",
    "presenter": "MD ALIM UL KARIM",
    "showBrandHeader": true
  },
  "Slides": [
    { "title": "Title",        "path": "../slides/01-slide.json" },
    { "title": "Capabilities", "path": "../slides/02-slide.json" }
  ]
}
```

**Add / remove rule:** delete an entry from `Slides[]` → that slide disappears from the deck. Add an entry → it appears. No code change.

**`data/slides/{NN-slide}.json`:** the per-slide payload (slideType, transition, textAnimation, content, etc.) — same shape already used in `spec/slides/showcase/`.

**`data/llmd.md`:** scratch notes the user feeds the LLM with context for editing the deck.

### 2.2 Theme Resolution

Themes are resolvable from two locations, in this priority order:

1. `front-end/project/{name}/themes/` — project-specific override
2. `front-end/themes/{theme-name}/` — shared, reusable theme

Each theme folder contains:
- `themes.json` — typography, spacing, radii, shadows, animation presets
- `colors.json` — semantic color tokens (background, foreground, gold, ember, capsule.*)

### 2.3 Slide Templates

`front-end/slide-template/{template-name}.json` defines a reusable layout (e.g. `TitleSlide`, `StepTimelineSlide`) that depends on `color.json` + `theme.json`. A slide JSON references a template by name; the renderer composes template + content + theme.

### 2.4 Assets

`front-end/project/{name}/assets/` is the canonical place for per-deck assets:
- `images/` — bitmap content (jpg, png, webp)
- `log/` — runtime logs (presentation events, screenshots)
- `svg/` — vector icons / illustrations referenced by slides

Slide JSON references assets by relative path: `"image": "../assets/images/foo.jpg"`.

---

## 3. Spec Folder — `spec/`

```
spec/
├── architecture/                # This document + diagrams
│   ├── Slides.md
│   ├── Slides.png
│   └── architecture.md  ← (you are here)
└── slides/
    └── {deck-slug}/
        ├── deck.json
        ├── 01-{name}.json
        ├── 01-{name}.md
        └── images/
```

Currently the active deck (`spec/slides/showcase/`) lives directly under `spec/slides/`. When we migrate to the full `front-end/project/` model, those files move into `front-end/project/showcase/data/` and `front-end/project/showcase/spec/`.

---

## 4. Mapping: Current → Future

| Today (Lovable preview)         | Future structure                                           |
| ------------------------------- | ---------------------------------------------------------- |
| `spec/slides/showcase/deck.json`| `front-end/project/showcase/data/slides.json`              |
| `spec/slides/showcase/NN-x.json`| `front-end/project/showcase/data/slides/NN-x.json`         |
| `spec/slides/showcase/NN-x.md`  | `front-end/project/showcase/spec/NN-x.md`                  |
| `src/index.css` tokens          | `front-end/themes/noir-gold/themes.json` + `colors.json`   |
| `src/assets/brand/`             | `front-end/project/showcase/assets/images/`                |

The loader (`src/slides/loader.ts`) will be extended to read from the project folder once we cut over.

---

## 5. Behavior Rules

1. **JSON-driven:** removing a slide JSON or removing its entry from `slides.json` → slide disappears
2. **Co-location:** a deck's content, assets, theme overrides, and specs live in one folder
3. **Theme cascade:** project theme > shared theme > built-in defaults
4. **Templates depend on theme + color** — never hard-coded values
5. **Backend optional:** the frontend works against static JSON files; PHP layer adds persistence/auth on top

---

## 6. Next Implementation Phases

1. **Phase 1 (done):** Spec-first showcase deck under `spec/slides/showcase/`
2. **Phase 2:** Scaffold the full folder tree with placeholders (this commit)
3. **Phase 3:** Move `showcase` into `front-end/project/showcase/` and update loader
4. **Phase 4:** Externalize theme to `front-end/themes/noir-gold/`
5. **Phase 5:** Slide template files in `front-end/slide-template/`
6. **Phase 6:** PHP backend + SQLite + auth
