# public/

Static assets **served as-is** at the site root (Vite copies them verbatim,
no hashing, no bundling). Reference them with absolute paths (`/sounds/x.mp3`).

## Contents
| Path | What lives here |
|---|---|
| `assets/` | Static files served directly (not imported by code — those go in `src/assets/`). |
| `reference/` | Reference imagery served at runtime. |
| `sounds/` | Audio cues used by the app (e.g. webcam/transition sounds). |
| `robots.txt` | Crawler directives. |
| `placeholder.svg` | Generic placeholder image. |

## Rule
Use `public/` only for files that must keep a stable URL or are fetched at
runtime. Anything imported by a component belongs in `src/assets/` so it gets
bundled and hashed.
