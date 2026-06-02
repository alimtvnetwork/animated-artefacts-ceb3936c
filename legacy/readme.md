# legacy/

Inert, archived, or reserved material kept for reference — **not built, not
imported, not served** by the running app. Safe to ignore when working on the
live React deck engine.

## Contents
- `php/` — placeholder for a future PHP backend (reserved per an early
  architecture spec). Contains only stubs/`.gitkeep`/`.placeholder` files; no
  executable backend exists. Moved here from the repo root on 2026-06-02 to keep
  the root limited to config + entry + active top-level dirs.

## Rule
Nothing in `legacy/` is wired into `vite.config.ts`, `src/`, or the build.
If something here becomes active again, move it out of `legacy/` to its proper
home and document it.
