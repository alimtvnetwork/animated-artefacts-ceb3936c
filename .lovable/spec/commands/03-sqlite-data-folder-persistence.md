# 03 — Persist with SQLite in a data/ folder at the run location

**Command (verbatim):** "whatever language you are using, Node.js or PHP … use the Git folder structure and use SQLite to save it … or save it in the running server in the run location with a data folder."

**Scope:** Any persistence written by **server-side / Node tooling** in this repo (scripts, generators, any future Node service). NOT the browser runtime.

**When it applies:**
- Whenever a task needs to persist structured data from Node/PHP/backend code.
- Default store = **SQLite**, file kept in a `data/` folder at the **run location** (the process working directory), committed/tracked per the existing git folder structure.
- Use the language already in play (this project = Node.js).

**Hard constraint / conflict to call out:**
- The shipped app is a **client-side React + Vite SPA** — there is no running Node/PHP server in production and SQLite cannot run in a browser. So the browser runtime keeps using its existing `localStorage` keys (`riseup.deck.draft.v1`, etc.).
- This SQLite-in-`data/` rule governs **Node-side scripts/tooling and any future backend service** only.
- If a future feature genuinely needs server persistence, prefer SQLite at `./data/<name>.sqlite` relative to the run location.

**Status:** active (captured 2026-06-06).
