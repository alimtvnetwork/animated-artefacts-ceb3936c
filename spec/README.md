# Spec — Riseup Asia Slide Presentation

Numbered top-level folders form the canonical spec layout. Each folder owns
one concern. Numbers are stable and referenced from chats, commits, and
memory; do not renumber without updating cross-links.

## Folder map

| Folder                  | Purpose |
|-------------------------|---------|
| `15-research/`          | Exploratory research notes — webcam overlay, prior-art studies, anything that informs (but is not yet) a system spec. |
| `21-slides-system/`     | **System design.** How the slide engine works: folder structure, slide mechanism, navigation/next-page, controller buttons, UI chrome, themes, animation rules, schemas, LLM authoring guides, architecture diagrams. Source of truth for engineering. |
| `22-slides-issues/`     | Bug reports and behavioural issues against the running app. One file per issue, numbered. |
| `26-slide-definitions/` | **Per-slide content.** Concrete deck definitions — one subfolder per deck (`showcase/`, `navy-showcase/`, `test-step-light/`, `image-examples/`). Each slide is a JSON spec + companion MD. JSON is the runtime source of truth. |
| `21-slides-system/images/` | **Image authoring contract.** How & where images go in JSON (asset / SVG / Base64 / data URI), the slot/`imageRole` model, captions, galleries, per-step thumbnails, and the inline size budget. Live demos: `image-examples` deck (`?deck=image-examples`). |
| `audit/`                | Phase-gate blind-LLM audits and acceptance reports. Historical record. |
| `camera-2026/`          | **Presenter-camera spec pack.** Blind-AI-ready, in-depth re-implementation guide for the webcam overlay (phases, shortcuts, zoom, fullscreen, auto-frame, squircle background plates). Includes reference/background images in `camera-2026/assets/`. |
| `27-slides-number/`     | **Slide-number spec pack.** Blind-AI-ready guide for every slide-number indicator (top bar, bottom badge, dot pagination, controller jump input), plus jump/routing, sound cue, visibility, tokens, and an acceptance checklist. |

## Where does my new file go?

- Documenting **how the system should behave** (a new slide type contract,
  a controller change, a theme rule, animation tokens) → `21-slides-system/`.
- Documenting **what a specific slide looks like** for a deck →
  `26-slide-definitions/{deck-name}/NN-name.{json,md}`.
- Reporting a **bug or unexpected behaviour** in the live app →
  `22-slides-issues/NN-short-title.md`.
- **Research / exploration** that hasn't yet hardened into a system rule →
  `15-research/`.
- Phase-gate **audit output** → `audit/`.

## Naming

- All spec files start with a two-digit prefix (`NN-kebab-case.md`) so
  ordering is explicit.
- Deck folders inside `26-slide-definitions/` use kebab-case names; each
  slide inside is `NN-name.json` plus `NN-name.md`.

## History

This layout was adopted on 2026-04-28. Previously, `spec/architecture/`,
`spec/issues/`, `spec/research/`, and a flat `spec/slides/` mixed system
specs with per-deck content. The reorganization split system rules from
slide content and gave research/issues their own numbered homes.
