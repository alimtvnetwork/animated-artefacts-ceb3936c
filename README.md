# Riseup Asia Slides

<!-- BADGE:VERSION -->
[![version](https://img.shields.io/badge/version-1.2.0-c9a84c?style=flat-square&labelColor=0d0d0d)](./readme.md)
<!-- /BADGE:VERSION -->

See [`readme.md`](./readme.md) for the full changelog. The badge above is
regenerated from `package.json` by `bun run badge` (or automatically on
`bun run version:bump`).

A designer-grade slide presentation engine for **Riseup Asia LLC**.
JSON-authored, voice-friendly, deck-portable. Built with React 18 + Vite +
Tailwind + TypeScript. Strict typing enforced in CI.

> **Mission:** any presenter (or AI) can describe a deck in plain language
> or voice, drop matching JSON into `spec/slides/<deck>/`, and get a
> Awwwards-grade presentation that runs in the browser, exports cleanly,
> and reproduces 1:1 across renderers.

---

## 🚀 Quickstart

Get from zero → live slide deck → your first authored slide in under two
minutes. The install script clones the slide-authoring scaffolding
(`spec/slides/`, `src/slides/`, `front-end/slide-template/`) from the
`coding-guidelines-v17` canonical repo, installs deps with `bun` (npm
fallback), and boots the dev server on `http://localhost:8080`.

### 1. Install

#### 🐧 macOS / Linux · Bash

```bash
curl -fsSL https://raw.githubusercontent.com/alimtvnetwork/coding-guidelines-v17/main/slides-install.sh | bash
```

#### 🪟 Windows · PowerShell

```powershell
irm https://raw.githubusercontent.com/alimtvnetwork/coding-guidelines-v17/main/slides-install.ps1 | iex
```

> **Prerequisites:** Bun (recommended) **or** Node.js 18+ with npm. Git is
> not required — the script downloads the archive over HTTPS.

### 2. Boot the deck

The script auto-starts Vite. Open <http://localhost:8080> — slide 1 of the
showcase deck loads. Use the keyboard:

| Key       | Action                                               |
|-----------|------------------------------------------------------|
| `←` / `→` | Previous / next slide                                |
| `g`       | Grid overview (jump to any slide)                    |
| `f`       | Fullscreen                                           |
| `p`       | Presenter view                                       |
| `/N`      | Visit `http://localhost:8080/3` to deep-link slide 3 |

The controller pill is hidden by default — hover the bottom of the
viewport to reveal prev / `N/total` / next / share / fullscreen.

### 3. Start a new deck (one command)

The fastest path from "I want a fresh deck" to "live URL with every slide
type filled in":

```bash
bun run new my-pitch
# ✓ Created deck "My Pitch" at spec/slides/my-pitch/
#   • 19 files copied from showcase template
# Opening http://localhost:8080/1?deck=my-pitch in your default browser…
```

`bun run new <slug>` scaffolds `spec/slides/<slug>/` with a full worked
example (every slide type the engine supports), patches `deck.json` with
the new slug + name, and opens the deck at
`http://localhost:8080/1?deck=<slug>`. The loader auto-discovers any
folder under `spec/slides/`, so the new deck is live as soon as Vite
hot-reloads.

```bash
bun run new q4-board --name "Q4 Board Update"
bun run new offsite --port 5173 --no-open
bun run new --help
```

Switch between bundled decks at any time with `?deck=<slug>` — defaults
to `?deck=showcase` when omitted.

### 4. Generate your first slide (the AI-authoring loop)

This is the whole point of the engine: **describe a slide in plain
English (or voice), and your AI agent authors the JSON.**

1. Pick a slide type from the catalog
   ([`spec/slides/llm/23-slide-type-contracts.md`](spec/slides/llm/23-slide-type-contracts.md)) —
   e.g. `TitleSlide`, `CapsuleListSlide`, `StepTimelineSlide`,
   `MetricGridSlide`, `QrMeetingSlide`.
2. Copy the matching starter from
   [`front-end/slide-template/`](front-end/slide-template/) — e.g.
   `cp front-end/slide-template/TitleSlide.json spec/slides/<deck>/01-title.json`.
3. Tell your AI agent (or write it yourself):
   > *"Title slide. Brand line 'Riseup Asia'. Headline 'Operator-grade
   > engineering'. Subhead 'Decks that ship 1:1 across renderers'.
   > Cinematic title animation."*
4. Save the JSON next to a sibling `01-title.md` (presenter notes / voice
   script / alt-text — humans-only, never read at runtime).
5. Add the slide to `spec/slides/<deck>/deck.json` if it isn't there yet.
6. Vite hot-reloads. Refresh the browser. Done.

Authoring references the AI will need:

- [Voice-to-slide protocol](spec/slides/llm/16-voice-to-slide-protocol.md) — exact prompt format.
- [JSON authoring cheatsheet](spec/slides/llm/06-json-authoring-cheatsheet.md) — every field, every preset.
- [Slide type contracts](spec/slides/llm/23-slide-type-contracts.md) — required + optional fields per type.
- [Acceptance checklist](spec/slides/llm/18-acceptance-checklist.md) — what "done" means.

### Power-user flags

```bash
# Stage files into a sibling dir, skip auto-install/start
./slides-install.sh --target ./my-deck --no-install --no-start

# Offline (CI / air-gapped) using a pre-staged tarball
./slides-install.sh --use-local-archive ./main.tar.gz

# Show full help
./slides-install.sh --help
```

```powershell
# PowerShell equivalents — pipe-and-execute form
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/alimtvnetwork/coding-guidelines-v17/main/slides-install.ps1))) -Target .\my-deck -NoInstall -NoStart

# Or after downloading the script locally
.\slides-install.ps1 -Target .\my-deck -NoInstall -NoStart
.\slides-install.ps1 -UseLocalArchive .\main.zip
.\slides-install.ps1 -Help
```

| Exit | Meaning                                       |
|------|-----------------------------------------------|
| 0    | success                                       |
| 1    | generic failure (missing tool, unknown flag)  |
| 2    | `--offline` requested but network was needed  |
| 3    | archive download failed                       |
| 4    | required folders missing from archive         |

### Daily development loop (after first install)

Once the project is on disk, you don't need the install script again:

```bash
bun run dev            # or: npm run dev   →  http://localhost:8080
```

Windows users have a convenience wrapper that pulls latest, installs if
needed, starts Vite, and opens the browser:

```powershell
.\run.ps1                  # opens slide 1
.\run.ps1 -Slide 3         # jumps straight to slide 3
.\run.ps1 -Port 5173       # custom port
.\run.ps1 -NoPull          # skip git pull
```

---

## What gets staged

| Folder                           | Purpose |
|----------------------------------|---------|
| `spec/slides/`                   | JSON Schemas, LLM authoring pack, showcase deck — **runtime source of truth** |
| `src/slides/`                    | React renderer (slide types, controllers, sound, ambient, themes) |
| `front-end/slide-template/`      | Per-slide-type starter JSON (TitleSlide, CapsuleListSlide, …) |

Everything you need to **author** decks lives in `spec/slides/`.
Everything you need to **render** them lives in `src/slides/`.

---

## Develop locally (without the install script)

```bash
git clone <this-repo>
cd <this-repo>
bun install        # or: npm install
bun run dev        # or: npm run dev   →  http://localhost:8080
```

Routing is flat: `/N` opens slide N (e.g. `/3` jumps straight to slide 3).
The controller bar is hidden until you hover the bottom of the viewport —
keyboard shortcuts work everywhere (`←`, `→`, `g` for grid overview,
`f` for fullscreen, `p` for presenter view).

---

## Authoring a new slide (the 30-second version)

1. Pick a slide type (`TitleSlide`, `CapsuleListSlide`, `StepTimelineSlide`,
   `MetricGridSlide`, `QrMeetingSlide`, …). Full catalog:
   [`spec/slides/llm/23-slide-type-contracts.md`](spec/slides/llm/23-slide-type-contracts.md).
2. Copy the matching template from `front-end/slide-template/`.
3. Drop it into `spec/slides/<deck>/NN-name.json` with a sibling
   `NN-name.md` (presenter notes, voice script, alt text — purely for
   humans/AI; never read at runtime).
4. Add the slide to `spec/slides/<deck>/deck.json` if needed.
5. Hot-reload picks it up.

Voice-to-slide protocol and authoring cheatsheet:
[`spec/slides/llm/06-json-authoring-cheatsheet.md`](spec/slides/llm/06-json-authoring-cheatsheet.md),
[`spec/slides/llm/16-voice-to-slide-protocol.md`](spec/slides/llm/16-voice-to-slide-protocol.md).

---

## CI / type-safety guarantees

Every push and PR runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

- **`tsc --noEmit`** on `tsconfig.app.json` and `tsconfig.node.json` — type
  errors block the merge.
- **ESLint** with `@typescript-eslint/no-explicit-any: error` — explicit
  `any` is **forbidden** in authored source. Use a precise type, or
  `unknown` followed by narrowing at the boundary.
- **Belt-and-braces grep guard** — even a `// eslint-disable-next-line` for
  `any` will trip CI, because the grep step also fails the build on
  `: any`, `<any>`, and `as any` patterns in `src/**` (excluding `ui/`
  shadcn boilerplate and tests).
- **Vitest** (`bun run test`) — schema validation, contract tests,
  spec-parity tests.
- **Production build** (`bun run build`) — must succeed.

### Local pre-flight

```bash
bunx tsc -p tsconfig.app.json --noEmit   # type check
bun run lint                              # eslint (fails on any/explicit any)
bun run test                              # vitest
bun run build                             # production build
```

### Why `any` is banned but `unknown` is allowed

- **`any`** silently disables type checking — every downstream call site
  becomes unsafe. It's the actual escape hatch CI must catch.
- **`unknown`** is type-*safe* — the compiler forces you to narrow before
  use. Use it deliberately for genuinely-unknown payloads (parsed JSON,
  `catch` errors) and refine at the boundary with a type guard.

---

## Project structure (top-level)

```
spec/slides/                  ← JSON specs + schemas + LLM authoring pack
src/slides/                   ← React renderer + controllers + sound + themes
src/pages/                    ← /N route, builder, presenter, settings
src/components/ui/            ← shadcn primitives (excluded from strict-any rule)
front-end/slide-template/     ← per-slide-type starter JSON
front-end/themes/             ← theme color/token JSON
.lovable/memory/              ← project memory rules (read every loop)
.github/workflows/ci.yml      ← strict-types CI
slides-install.sh             ← Unix bootstrap (curl | bash)
slides-install.ps1            ← Windows bootstrap (irm | iex)
```

For a guided tour of the slide system itself, start at
[`spec/slides/README.md`](spec/slides/README.md) and
[`spec/slides/llm/00-README.md`](spec/slides/llm/00-README.md).

---

## License & credits

Presenter: **MD ALIM UL KARIM** · Org: **Riseup Asia LLC**.
Install-script conventions adapted from
[`alimtvnetwork/coding-guidelines-v17`](https://github.com/alimtvnetwork/coding-guidelines-v17).
