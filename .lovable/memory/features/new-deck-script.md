---
name: new-deck-script
description: One-command "start new deck" CLI (`bun run new <slug>`) that scaffolds spec/slides/<slug>/ from the showcase template and opens it via ?deck=<slug>. Loader widened to multi-deck via import.meta.glob spec/slides/*/*.json.
type: feature
---

## What
v0.149 added a one-command path for spinning up a brand-new deck without
hand-copying files or touching the loader.

## Files
- `scripts/new-deck.ts` — Bun CLI. Validates slug, refuses overwrite + the
  reserved `showcase` slug, copies every JSON+MD from
  `spec/slides/showcase/` into `spec/slides/<slug>/`, patches `deck.json`'s
  `deckSlug` + `deckName`, prints the live URL, opens browser.
- `src/slides/loader.ts` — `import.meta.glob` widened from
  `spec/slides/showcase/*.json` → `spec/slides/*/*.json`. Files grouped by
  folder slug into `bundledDecks: Map<slug, {deck, slides}>`. Active deck
  resolved via `?deck=<slug>` URL param at module-init, fallback `showcase`.
  Exports new symbols: `availableDeckSlugs`, `activeDeckSlug`.
- `src/pages/SlideDeckPage.tsx` — Both `navigate(...)` calls now append
  `${location.search}` so `?deck=<slug>` survives slide-to-slide navigation.

## CLI surface
```
bun run new <slug>                        # scaffold + open browser
bun run new <slug> --name "Pretty Name"
bun run new <slug> --port 5173            # custom dev port for the URL
bun run new <slug> --no-open              # skip browser launch
bun run new --help
```

Aliases: `bun run new` and `bun run new:deck` both point at the same script.

## Slug rules
- Lowercase kebab-case: `^[a-z][a-z0-9-]{1,48}[a-z0-9]$`
- Reserved: `showcase` (the canonical demo). Any other existing folder
  also triggers the duplicate-refusal exit code.

## Exit codes
- 0 success
- 1 generic (missing arg, invalid slug, used reserved slug)
- 2 destination already exists (refused to overwrite)
- 3 source `spec/slides/showcase/` missing (broken layout)

## Why "copy showcase" instead of "copy front-end/slide-template/"
The `front-end/slide-template/*.json` files are template *metadata*
(field schemas, defaults), not valid `SlideSpec` instances. Copying them
straight in would fail contract validation. The showcase deck is the
canonical, validated worked example covering every slide type — it's the
fastest path to a deck that boots cleanly.

## Multi-deck loading model
- One active deck per page-load, selected at module-init from
  `?deck=<slug>`. Switching decks requires a reload (matches existing
  imported-manifest behavior).
- Imported manifests (localStorage `IMPORTED_MANIFEST_KEY`) still win over
  the URL param — the existing precedence is unchanged.
- Unknown slugs silently fall back to `showcase` so a typo never blocks boot.
