# src/

The React + Vite application. Renders JSON-defined decks at a fixed 1920×1080
canvas, scaled to fit. Follow `.lovable/coding-guidelines.md` (files ≤100 lines,
functions ≤8 lines, no `any`, semantic tokens only — never raw hex).

## Subfolder map
| Folder | What lives here |
|---|---|
| `slides/` | The renderer **engine**: `loader.ts` (loads deck JSON), `contracts.ts` (zod schemas), `themes.ts`, slide-type components in `components/`, animation + motion logic, analytics recorder. |
| `builder/` | The deck-builder UI (visual editing of decks). |
| `pages/` | Route components — `/N` slide route, presenter, settings, analytics. |
| `components/` | Shared UI primitives (shadcn-based) reused across pages. |
| `hooks/` | Reusable React hooks. |
| `lib/` | Framework-agnostic helpers/utilities. |
| `types/` | Shared TypeScript types. |
| `assets/` | **Bundled** assets imported by code (`brand/` logos via `BrandLogo`, controller reference). |
| `releases/` | Release-notes data consumed by the app. |
| `test/` | Vitest suites (schema validation, slide contracts, spec-parity, visual QA). |
| `App.tsx` / `main.tsx` / `index.css` | App shell, entry, global tokens + semantic typography classes. |

## What does NOT go here
- Runtime deck content → `front-end/project/<deck>/data/`.
- Specs → `spec/`. Generated quality evidence → `quality/`.

## Add a slide type
New `slideType` needs: renderer in `slides/components/`, zod contract in
`slides/contracts.ts`, a starter in `front-end/slide-template/`, and a contract test.
