/**
 * vite-plugin-lucide-per-icon
 *
 * Rewrites `import { Foo, Bar } from 'lucide-react'` into per-icon deep
 * imports (`import Foo from 'lucide-react/dist/esm/icons/foo.js'`) so Rollup
 * can tree-shake the library down to only the icons we actually use.
 *
 * Why we need this:
 *   lucide-react's barrel (`dist/esm/lucide-react.js`) starts with
 *   `import * as index from './icons/index.js'; export { index as icons };`
 *   That namespace re-export prevents tree-shaking and pulls all ~1500
 *   icons into the bundle (~688 KB raw → 115 KB gzip). Per-icon imports
 *   sidestep the barrel entirely.
 *
 * Type-only imports (`import type { LucideProps, LucideIcon }`) and
 * inline-type members (`import { type LucideIcon, X }`) are preserved or
 * split out — types don't affect bundle size.
 *
 * The `Name → filename` map is built once from the barrel itself, so we're
 * always in lock-step with whatever lucide-react version is installed
 * (handles aliases like `AlarmCheck` → `alarm-clock-check.js` correctly).
 */
import type { Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function buildNameMap(): Map<string, string> {
  const barrelPath = require.resolve('lucide-react/dist/esm/lucide-react.js');
  const src = readFileSync(barrelPath, 'utf8');
  const map = new Map<string, string>();
  // Lines look like:
  // export { default as Foo, default as FooIcon, ... } from './icons/foo.js';
  const re = /export\s*\{([^}]+)\}\s*from\s*['"]\.\/icons\/([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const body = m[1];
    const file = m[2].replace(/\.js$/, '');
    const names = body.match(/default\s+as\s+([A-Za-z0-9_$]+)/g) || [];
    for (const n of names) {
      const name = n.replace(/^default\s+as\s+/, '');
      if (!map.has(name)) map.set(name, file);
    }
  }
  return map;
}

const TYPE_NAMES = new Set(['LucideProps', 'LucideIcon', 'IconNode', 'LucideProps']);

export function lucidePerIcon(): Plugin {
  let nameMap: Map<string, string>;
  return {
    name: 'lucide-per-icon',
    enforce: 'pre',
    configResolved() {
      nameMap = buildNameMap();
    },
    transform(code, id) {
      if (!/\.(t|j)sx?$/.test(id)) return null;
      if (id.includes('node_modules')) return null;
      if (!code.includes('lucide-react')) return null;

      const RE = /import\s*(type\s+)?\{([^}]+)\}\s*from\s*['"]lucide-react['"]\s*;?/g;
      let changed = false;
      const out = code.replace(RE, (full, isAllTypes, body) => {
        const parts = body.split(',').map((s: string) => s.trim()).filter(Boolean);
        const valueLines: string[] = [];
        const typeNames: string[] = [];

        for (const p of parts) {
          const isInlineType = /^type\s+/.test(p);
          const clean = p.replace(/^type\s+/, '');
          const m = clean.match(/^([A-Za-z0-9_$]+)(?:\s+as\s+([A-Za-z0-9_$]+))?$/);
          if (!m) return full; // give up on weird forms
          const [, name, alias] = m;

          if (isAllTypes || isInlineType || TYPE_NAMES.has(name)) {
            typeNames.push(alias ? `${name} as ${alias}` : name);
            continue;
          }
          const file = nameMap.get(name);
          if (!file) return full; // unknown — leave whole import alone
          const local = alias || name;
          valueLines.push(`import ${local} from 'lucide-react/dist/esm/icons/${file}.js';`);
        }

        changed = true;
        const lines: string[] = [];
        if (typeNames.length) {
          lines.push(`import type { ${typeNames.join(', ')} } from 'lucide-react';`);
        }
        lines.push(...valueLines);
        return lines.join('\n');
      });

      return changed ? { code: out, map: null } : null;
    },
  };
}
