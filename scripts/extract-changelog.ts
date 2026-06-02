#!/usr/bin/env bun
/**
 * extract-changelog.ts
 *
 * Extracts the section for a given version from `readme.md` (the project's
 * combined README + changelog) and emits it as a clean, GitHub-Release-ready
 * Markdown block on stdout, plus a small machine-readable header in HTML
 * comments so consumers (CI, the release workflow) can sanity-check what
 * they got.
 *
 * Why this exists
 * ---------------
 * The `readme.md` changelog is heterogeneous: the latest entry uses an
 * `## vX.Y.Z — …` heading (with sub-`###` sections), while older entries
 * use a bare `vX.Y.Z — …` line with no heading marker. A single
 * "next-heading" terminator regex handles both: we stop the section at the
 * first line that matches either form, OR at end-of-file.
 *
 * Usage
 *   bun ./scripts/extract-changelog.ts                 # auto: read package.json#version
 *   bun ./scripts/extract-changelog.ts 1.1.0           # explicit version (no v-prefix)
 *   bun ./scripts/extract-changelog.ts v1.1.0          # v-prefix tolerated
 *   bun ./scripts/extract-changelog.ts --out notes.md  # write to file (and stdout)
 *
 * Exit codes
 *   0  section found and emitted
 *   1  CLI / IO error (readme.md missing, etc.)
 *   2  version section not found in readme.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/* ---------------- args ---------------- */
const argv = process.argv.slice(2);
let version: string | null = null;
let outPath: string | null = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--out' || a === '-o') { outPath = argv[++i] ?? null; continue; }
  if (a.startsWith('--out=')) { outPath = a.slice(6); continue; }
  if (a.startsWith('-')) {
    console.error(`extract-changelog: unknown flag ${a}`);
    process.exit(1);
  }
  if (!version) version = a;
}

if (!version) {
  const pkgPath = resolve(process.cwd(), 'package.json');
  if (!existsSync(pkgPath)) {
    console.error('extract-changelog: no version arg and no package.json found');
    process.exit(1);
  }
  version = (JSON.parse(readFileSync(pkgPath, 'utf8')).version as string) ?? null;
  if (!version) {
    console.error('extract-changelog: package.json has no "version" field');
    process.exit(1);
  }
}
// Tolerate `v` prefix on input.
version = version.replace(/^v/i, '');
const tag = `v${version}`;

/* ---------------- locate readme.md ---------------- */
// Lowercase `readme.md` is the changelog file in this project; uppercase
// `readme.md` is the public quick-start. Prefer lowercase, fall back to
// uppercase only if the lowercase one doesn't exist.
const candidates = ['readme.md', 'readme.md'];
const readmePath = candidates
  .map(p => resolve(process.cwd(), p))
  .find(p => existsSync(p));
if (!readmePath) {
  console.error('extract-changelog: neither readme.md nor readme.md found at project root');
  process.exit(1);
}
const raw = readFileSync(readmePath, 'utf8');
const lines = raw.split('\n');

/* ---------------- section extraction ---------------- */
// Match any version heading. Two shapes are valid:
//   "## vX.Y.Z — …"  (current)
//   "vX.Y.Z — …"     (older, no heading marker)
// SemVer: digits.dot.digits.dot.digits (no pre-release suffixes used in
// this project's changelog yet — keep the regex tight on purpose).
const VERSION_HEADING = /^(?:##\s+)?v(\d+\.\d+\.\d+)\b/;

// Find the start of the requested version's section.
let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  const m = VERSION_HEADING.exec(lines[i]);
  if (m && m[1] === version) { startIdx = i; break; }
}
if (startIdx === -1) {
  console.error(`extract-changelog: section for ${tag} not found in ${readmePath}`);
  process.exit(2);
}

// Find the next version heading after the start — that's our terminator.
let endIdx = lines.length;
for (let i = startIdx + 1; i < lines.length; i++) {
  if (VERSION_HEADING.test(lines[i])) { endIdx = i; break; }
}

// Slice, then trim trailing blank lines (so the body doesn't end with `\n\n\n`).
const section = lines.slice(startIdx, endIdx);
while (section.length > 1 && section[section.length - 1].trim() === '') section.pop();

/* ---------------- format for GitHub Release ---------------- */
// GitHub Releases render the **first** line of the body very prominently.
// The existing readme heading is `## v1.1.0 — Release notes (since vX.Y.Z)`.
// The Release page already shows the tag + title above the body, so a
// duplicate `## v1.1.0` heading reads as noise. We strip the leading
// version heading and demote the inner `###` headings to `##` so the
// Release body has a normal heading hierarchy.
const body: string[] = [];
let strippedHeading = false;
for (let i = 0; i < section.length; i++) {
  let line = section[i];
  if (!strippedHeading) {
    if (VERSION_HEADING.test(line)) {
      // Drop the version heading itself + any immediately following blank.
      strippedHeading = true;
      if (section[i + 1]?.trim() === '') i++;
      continue;
    }
  }
  // Demote `###` → `##` (and `####` → `###`) for cleaner hierarchy under
  // GitHub's "release title" h1 chrome.
  if (/^####\s/.test(line))      line = line.replace(/^####\s/, '### ');
  else if (/^###\s/.test(line))  line = line.replace(/^###\s/,  '## ');
  body.push(line);
}

/* ---------------- emit ---------------- */
const header = [
  `<!-- extract-changelog: tag=${tag} source=${readmePath.split('/').pop()} lines=${startIdx + 1}-${endIdx} -->`,
  '',
].join('\n');
const output = header + body.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';

process.stdout.write(output);
if (outPath) {
  writeFileSync(resolve(process.cwd(), outPath), output, 'utf8');
  // Diagnostic to stderr so stdout remains clean for piping.
  process.stderr.write(`extract-changelog: wrote ${outPath} (${output.length} bytes, lines ${startIdx + 1}-${endIdx})\n`);
}
