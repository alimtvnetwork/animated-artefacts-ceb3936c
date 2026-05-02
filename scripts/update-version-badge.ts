/**
 * update-version-badge.ts
 *
 * Reads the current version from `package.json` and rewrites the
 * `<!-- BADGE:VERSION --> … <!-- /BADGE:VERSION -->` block in README.md
 * with a fresh shields.io URL. Idempotent — safe to run on every commit
 * or in CI. Themed in deck colors (gold #c9a84c on noir #0d0d0d).
 *
 * Usage:
 *   bun run badge
 *   bun scripts/update-version-badge.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname ?? '.', '..');
const PKG = resolve(ROOT, 'package.json');
const README = resolve(ROOT, 'README.md');

const pkg = JSON.parse(readFileSync(PKG, 'utf8')) as { version: string };
const version = pkg.version;
if (!version) {
  console.error('No version field in package.json');
  process.exit(1);
}

const badge =
  `[![version](https://img.shields.io/badge/version-${encodeURIComponent(version)}-c9a84c?style=flat-square&labelColor=0d0d0d)](./readme.md)`;

const readme = readFileSync(README, 'utf8');
const block = /<!-- BADGE:VERSION -->[\s\S]*?<!-- \/BADGE:VERSION -->/;
if (!block.test(readme)) {
  console.error('BADGE:VERSION markers not found in README.md');
  process.exit(1);
}

const next = readme.replace(
  block,
  `<!-- BADGE:VERSION -->\n${badge}\n<!-- /BADGE:VERSION -->`,
);

if (next === readme) {
  console.log(`✓ Badge already up to date (v${version}).`);
} else {
  writeFileSync(README, next, 'utf8');
  console.log(`✓ Updated README badge → v${version}.`);
}
