---
name: live-edit-php
description: DEFERRED feature — in-slide edit button that persists slide content back to JSON via a self-hosted PHP backend. NOT Lovable Cloud / Supabase / Node. React is built to /dist and dropped into the PHP webroot for deployment.
type: feature
---

## Status: DEFERRED (do not implement until user explicitly says "let's build live edit")

The user wants to add an in-slide **Edit** button that:
1. Opens an inline editor on the active slide (eyebrow / title / steps / capsules / description / etc.)
2. Saves the edited content back to `spec/slides/showcase/NN-name.json`
3. Optionally exports the whole deck as a downloadable archive

## Architecture (locked decisions)

- **Backend: PHP, self-hosted.** NEVER Lovable Cloud, NEVER Supabase, NEVER Node.js. The user wants to own the server / hosting.
- **Frontend: React (this Vite app), built to `/dist`** and dropped into the PHP project's webroot so the whole thing deploys as one static-ish bundle that PHP serves + augments.
- **Project layout already scaffolded:** `php/src/` exists in the repo with `authentication/`, `data/`, `traits/` folders. Spec lives at `spec/architecture/architecture.md`.

## Build + deploy flow (what to wire up later)

1. `bun run build` → emits `dist/`.
2. A small npm script copies `dist/` → `php/public/` (or whatever the PHP webroot ends up being).
3. PHP serves `index.html` for any non-API route; API routes live under `/api/*`.
4. The slide JSON files live under `php/src/data/slides/showcase/*.json` in production. In dev they stay at `spec/slides/showcase/`.

## Required PHP endpoints (when we build it)

| Method + Path | Purpose | Body |
|---|---|---|
| `GET /api/slides` | List all slide JSON files in the active deck | — |
| `GET /api/slides/{name}` | Fetch one slide JSON | — |
| `PUT /api/slides/{name}` | Overwrite one slide JSON | `{ slideSpec }` |
| `POST /api/slides/export` | Zip the deck + return download URL | — |
| `POST /api/auth/login` | Session login (presenter-only edit) | `{ user, pass }` |

Path sanitization is non-negotiable: only allow `[a-zA-Z0-9-_]+\.json` under the showcase dir. No `..`, no absolute paths, no symlink traversal.

## Frontend changes (when we build it)

- Add an **Edit** pill button next to the controller pill on `SlideStage`. Visible only when authed.
- Inline editor: clicking opens a side drawer (`<Sheet>`) populated from the current `SlideSpec`. Form schema reuses `src/builder/fieldSchemas.ts` (already exists for the `BuilderPage`).
- Save → `PUT /api/slides/{name}` → on 200, hot-reload the slide from the new JSON (the loader at `src/slides/loader.ts` already eagerly imports — for live edit it'll need a fetch path that skips the eager bundle).
- Auth gate: if PHP returns 401 on PUT, prompt for login.

## Why PHP over Node

User explicitly stated: PHP is preferred because they already host PHP. Node would also work but adds another runtime to manage. PHP is the chosen route.

## Why NOT in-browser-only download

User wants a real save-to-server flow eventually, not "download the JSON and re-commit it manually." The download approach is fine for solo prototyping but not for the actual product.

## When to revisit

Wait for the user to say one of:
- "let's build the live edit"
- "let's add the PHP backend"
- "wire up the edit button"

Until then, do NOT scaffold PHP files, do NOT add an Edit button, do NOT add a save endpoint. Keep this as docs only.
