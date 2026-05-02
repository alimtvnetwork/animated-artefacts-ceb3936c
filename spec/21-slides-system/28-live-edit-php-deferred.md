# 28 — Live Edit + PHP Backend (DEFERRED)

**Status:** DEFERRED. Do NOT implement until the user explicitly asks.
This spec exists so any AI / human picking up the work later has the
full architectural context locked in.

## Goal

An in-slide **Edit** button that lets the presenter / author edit slide
content (eyebrow, title, steps, capsules, descriptions, etc.) directly
on the slide and persist changes back to the JSON files that drive the
deck. Edits survive a page reload because they're written to disk on
the server.

## Locked architectural decisions

These are not up for re-discussion:

1. **Backend = PHP, self-hosted.** No Lovable Cloud. No Supabase. No
   Node.js. The user owns their hosting and runs PHP.
2. **Frontend = this React + Vite app, built to `/dist`** and copied
   into the PHP project's webroot. PHP serves the SPA shell + the API.
3. **Slide JSONs are the source of truth.** The editor reads + writes
   the same JSON shape that `spec/slides/showcase/*.json` already uses.
   Schema: `spec/slides/slide.schema.json`.
4. **Live-reload after save** — when the editor PUTs a slide, the
   running deck swaps in the new JSON without a full page refresh.

## Build + deploy pipeline

```
bun run build                 # → ./dist
cp -r dist/* php/public/      # served by PHP
# PHP serves /api/* itself, falls back to dist/index.html for SPA routes
```

## API surface (PHP)

All endpoints under `/api`. JSON in, JSON out. CSRF token on every
mutating call. Session cookie auth.

| Method | Path                          | Purpose                                |
|--------|-------------------------------|----------------------------------------|
| POST   | `/api/auth/login`             | `{user, pass}` → sets session cookie   |
| POST   | `/api/auth/logout`            | clears session                         |
| GET    | `/api/decks`                  | list decks                             |
| GET    | `/api/decks/{deck}/slides`    | list slides in a deck                  |
| GET    | `/api/decks/{deck}/slides/{name}` | fetch one slide                    |
| PUT    | `/api/decks/{deck}/slides/{name}` | overwrite one slide (auth required)|
| POST   | `/api/decks/{deck}/export`    | zip + download                         |

### Path safety rule

Slide name pattern (whitelist): `^[0-9]{2}-[a-z0-9-]+\.json$`.
Reject anything else with `400`. Resolve full path and verify it
starts with the deck's data dir. No `..`, no symlink follow.

## Frontend additions (when we build it)

- New `EditButton` in the controller pill (only when authed).
- New `<SlideEditorDrawer>` reusing `src/builder/fieldSchemas.ts` and
  `src/builder/ContentFieldEditor.tsx` (both already exist).
- New `src/api/slidesApi.ts` wrapping `fetch('/api/...')`.
- `src/slides/loader.ts` gains a runtime fetch path so edits hot-load
  without the eager Vite glob.
- Optimistic update: on Save, mutate the in-memory deck, then PUT.
  On 4xx/5xx, roll back + toast the error.

## Why PHP

User wants their own server and own hosting. PHP is what they run.
Node was offered as an alternative; user chose PHP. The `php/` folder
already exists in the repo (see `php/src/authentication/`,
`php/src/data/`, `php/src/traits/`).

## When to start building

Trigger phrases from the user:
- "let's build the live edit"
- "let's wire up the PHP backend"
- "add the edit button now"

Until one of those, this spec stays as docs only — no PHP files, no
edit button, no API wiring.

## Open questions to ask the user when work starts

1. Where will the JSON files live in production — same path as dev
   (`spec/slides/showcase/`) or a new `php/data/slides/` dir?
2. Single-user auth (one presenter password) or multi-user accounts?
3. Do you want a version history (git auto-commit on save) or just
   overwrite-in-place?
4. Should the Export endpoint zip just the JSONs or also the assets
   (images, QR svgs)?
