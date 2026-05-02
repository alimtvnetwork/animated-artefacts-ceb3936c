# 48 — Lucide per-icon plugin: working at transform layer, not at bundle layer

## Status: WIP — plugin landed, investigation parked

## What shipped
- `vite-plugins/lucide-per-icon.ts` — Vite plugin (`enforce: 'pre'`, transform stage) that rewrites every `import { Foo, Bar } from 'lucide-react'` in app source into per-icon deep imports `import Foo from 'lucide-react/dist/esm/icons/foo.js'`.
- `Name → filename` map is built dynamically by parsing the lucide barrel (`dist/esm/lucide-react.js`) on `configResolved`, so aliases like `AlarmCheck → alarm-clock-check.js` and `Code2 → code-xml.js` are handled correctly across versions. 5217 mapped names from lucide v0.462.0.
- Type-only members (`LucideProps`, `LucideIcon`, inline `type X`) are split out into a preserved `import type { ... } from 'lucide-react'` line.
- Wired into `vite.config.ts` plugins array (before `react()`).

## What's verified working
- Plugin transforms 45 source files.
- Resolver sees only 20 unique per-icon paths (e.g. `icons/chevron-left.js`, `icons/clock.js`) — **zero** resolves to the barrel.
- No source file remains importing the namespace.

## The mystery
- Despite 0 barrel resolves and only 20 icon files in the graph, `vendor-lucide-*.js` is still **687 KB / 115 KB gzip with 4839 SVG path strings** (= ~all 1500 lucide icons).
- The output hash didn't change between "no plugin" and "plugin active" builds — strong signal that the same module set is reaching Rollup output.
- Chunk hash = `DcJ71DPI` either way.

## Hypotheses to investigate next
1. **manualChunks side-effect**: `if (id.includes('lucide-react')) return 'vendor-lucide'` may be loading additional modules into the chunk via Rollup's preserveModules / chunk hoisting. Test: drop the lucide rule entirely and let Rollup natural-split.
2. **Rollup preserves namespace re-exports of `icons/index.js`**: the per-icon files (e.g. `code-2.js`) re-export from `code-xml.js`, which is fine — but `icons/index.js` itself may be entered as a side-effectful module by something. Check `sideEffects: false` actually being honored (it is, per package.json — but Vite may override).
3. **Vite SSR/optimizeDeps interference in production build**: unlikely (optimizeDeps is dev-only) but worth ruling out by `optimizeDeps.exclude: ['lucide-react']`.
4. **lovable-tagger or another `enforce: 'pre'` plugin** re-injecting barrel imports during JSX tagging in `mode === 'development'`. Production build sets `mode === 'production'` so tagger is filtered out — so probably not it.
5. **Rollup tree-shaking failing on the per-icon re-export chain** (`code-2.js → code-xml.js`). Try aliasing directly to `code-xml.js` in the plugin (resolve through the Name→file map's *canonical* file by reading the icon file and following the `export { default } from ...` line once).

## Next-session entry point
- Drop the `lucide-react` line from `manualChunks` and rebuild — if `vendor-lucide` disappears and the icon code spreads across other chunks at small total size, hypothesis #1 is confirmed.
- Otherwise, add `optimizeDeps.exclude: ['lucide-react']` and `ssr.noExternal` tweaks.
- Last resort: alias `lucide-react` resolve to a tiny generated barrel containing only the icons we actually use (build-time codegen from registry + grep).

## Files touched this loop
- created `vite-plugins/lucide-per-icon.ts`
- edited `vite.config.ts` (plugin import + register)
- created `.lovable/question-and-ambiguity/48-lucide-per-icon-investigation.md`
- bumped `.lovable/question-and-ambiguity/task-counter.md` → 10/40
