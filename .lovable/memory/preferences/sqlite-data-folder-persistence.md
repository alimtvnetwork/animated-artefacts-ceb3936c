---
name: SQLite persistence in data/ folder
description: Node/server-side tooling persists to SQLite in a data/ folder at the run location; browser runtime stays on localStorage
type: preference
---
Any **server-side / Node (or PHP) tooling** that persists structured data must use **SQLite**, stored in a `data/` folder at the **run location** (process CWD), following the existing git folder structure. Use whatever language is already in play (this project = Node.js).

**How to apply:** default to `./data/<name>.sqlite` relative to where the process runs; track it per the repo's git folder layout.

**Why / constraint:** The shipped app is a browser-only React+Vite SPA with no production Node/PHP server, and SQLite cannot run in a browser. So the **browser runtime keeps using its `localStorage` keys** (`riseup.deck.draft.v1`, etc.) — this rule only governs Node-side scripts/tooling and any future backend service. See `.lovable/spec/commands/03-sqlite-data-folder-persistence.md`.
