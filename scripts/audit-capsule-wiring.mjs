#!/usr/bin/env node
/**
 * Capsule wiring audit.
 *
 * Scans every JSON slide spec under spec/slides/<deck>/*.json and reports:
 *
 *   1. UNWIRED       — capsule has neither `expand` nor `clickRevealSlide`.
 *                      These are leaf labels (intentional in some cases like
 *                      $ amounts, but worth auditing).
 *
 *   2. LEGACY-MISMATCH — capsule uses `revealSlide` (the StepSpec/HotspotSpec
 *                        field) instead of `clickRevealSlide` (the CapsuleSpec
 *                        field). Renderer ignores it silently → broken click.
 *                        Same bug we hit on navy-showcase/02-pillars.json.
 *
 *   3. ORPHAN-TARGET   — clickRevealSlide → N where N has no matching spec
 *                        file in any deck. Likely a stale number after a
 *                        renumber.
 *
 *   4. EXPAND-EMPTY    — capsule.expand exists but has no title/body/capsules
 *                        (modal would open with nothing useful).
 *
 * Run:  node scripts/audit-capsule-wiring.mjs
 * Exit: 0 always (informational); use --strict to exit non-zero on findings.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'spec/slides';
const STRICT = process.argv.includes('--strict');

function listDecks() {
  return readdirSync(ROOT)
    .filter(name => {
      try { return statSync(join(ROOT, name)).isDirectory(); }
      catch { return false; }
    })
    // Skip non-deck folders.
    .filter(name => !['assets', 'images', 'llm'].includes(name));
}

function listSpecs(deck) {
  const dir = join(ROOT, deck);
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => join(dir, f));
}

function loadAllSlideNumbers() {
  const known = new Set();
  for (const deck of listDecks()) {
    for (const file of listSpecs(deck)) {
      try {
        const j = JSON.parse(readFileSync(file, 'utf8'));
        if (typeof j.slideNumber === 'number') known.add(j.slideNumber);
      } catch { /* skip parse errors here; reported below */ }
    }
  }
  return known;
}

const knownSlides = loadAllSlideNumbers();

const findings = {
  unwired:        [], // { file, slide, idx, text }
  legacyMismatch: [], // { file, slide, idx, text, badField, value }
  orphanTarget:   [], // { file, slide, idx, text, target }
  expandEmpty:    [], // { file, slide, idx, text }
  parseErrors:    [], // { file, error }
};

function isExpandUseful(expand) {
  if (!expand || typeof expand !== 'object') return false;
  return Boolean(
    expand.title ||
    expand.body  ||
    expand.eyebrow ||
    (Array.isArray(expand.capsules) && expand.capsules.length > 0) ||
    expand.cta,
  );
}

/** Walk all `capsules` arrays nested anywhere in the spec content. */
function walkCapsules(node, visit, path = []) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((v, i) => walkCapsules(v, visit, path.concat(i)));
    return;
  }
  if (Array.isArray(node.capsules)) {
    node.capsules.forEach((cap, i) => visit(cap, [...path, 'capsules', i]));
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === 'capsules') continue;
    walkCapsules(v, visit, path.concat(k));
  }
}

for (const deck of listDecks()) {
  for (const file of listSpecs(deck)) {
    let spec;
    try {
      spec = JSON.parse(readFileSync(file, 'utf8'));
    } catch (e) {
      findings.parseErrors.push({ file, error: e.message });
      continue;
    }
    const slide = spec.slideNumber ?? '?';

    walkCapsules(spec.content, (cap, path) => {
      if (!cap || typeof cap !== 'object') return;
      const text = cap.text ?? cap.label ?? '(no text)';
      const idx = path.join('.');
      const hasExpand = isExpandUseful(cap.expand);
      const hasReveal = typeof cap.clickRevealSlide === 'number';
      const hasLegacy = typeof cap.revealSlide === 'number';

      // (2) Legacy mismatch — revealSlide on a capsule is silently ignored.
      if (hasLegacy && !hasReveal) {
        findings.legacyMismatch.push({
          file, slide, idx, text,
          badField: 'revealSlide',
          value: cap.revealSlide,
        });
      }

      // (4) Empty expand payload.
      if (cap.expand && !hasExpand) {
        findings.expandEmpty.push({ file, slide, idx, text });
      }

      // (1) Unwired — no expand and no clickRevealSlide and no legacy.
      if (!hasExpand && !hasReveal && !hasLegacy) {
        findings.unwired.push({ file, slide, idx, text });
      }

      // (3) Orphan target.
      if (hasReveal && !knownSlides.has(cap.clickRevealSlide)) {
        findings.orphanTarget.push({
          file, slide, idx, text, target: cap.clickRevealSlide,
        });
      }
    });
  }
}

/* ---------------- report ---------------- */

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red:   '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m', green: '\x1b[32m',
};

function header(label, color, count) {
  const tag = count === 0 ? `${c.green}OK${c.reset}` : `${color}${count}${c.reset}`;
  console.log(`\n${c.bold}${label}${c.reset}  [${tag}]`);
}

function row(deck, slide, idx, text, extra = '') {
  const trimmed = String(text).slice(0, 60);
  console.log(`  ${c.dim}${deck}${c.reset}  slide ${c.cyan}${slide}${c.reset}  ${c.dim}@${idx}${c.reset}  "${trimmed}"${extra ? '  ' + extra : ''}`);
}

console.log(`${c.bold}Capsule wiring audit${c.reset}  ${c.dim}(${knownSlides.size} known slides across ${listDecks().length} decks)${c.reset}`);

header('1. UNWIRED capsules (no expand, no clickRevealSlide)', c.yellow, findings.unwired.length);
for (const f of findings.unwired) row(f.file, f.slide, f.idx, f.text);

header('2. LEGACY MISMATCH (`revealSlide` on capsule — should be `clickRevealSlide`)', c.red, findings.legacyMismatch.length);
for (const f of findings.legacyMismatch) row(f.file, f.slide, f.idx, f.text, `${c.red}${f.badField}=${f.value}${c.reset}`);

header('3. ORPHAN clickRevealSlide targets (slide N not found in any deck)', c.red, findings.orphanTarget.length);
for (const f of findings.orphanTarget) row(f.file, f.slide, f.idx, f.text, `${c.red}→ slide ${f.target}${c.reset}`);

header('4. EMPTY expand payloads (no title/body/eyebrow/capsules/cta)', c.yellow, findings.expandEmpty.length);
for (const f of findings.expandEmpty) row(f.file, f.slide, f.idx, f.text);

if (findings.parseErrors.length) {
  header('PARSE ERRORS', c.red, findings.parseErrors.length);
  for (const f of findings.parseErrors) console.log(`  ${f.file}\n    ${c.red}${f.error}${c.reset}`);
}

const blockers = findings.legacyMismatch.length + findings.orphanTarget.length + findings.parseErrors.length;
const warnings = findings.unwired.length + findings.expandEmpty.length;
console.log(`\n${c.bold}Summary${c.reset}: ${c.red}${blockers} blocker(s)${c.reset}, ${c.yellow}${warnings} warning(s)${c.reset}.`);

if (STRICT && (blockers > 0 || warnings > 0)) process.exit(1);
process.exit(0);
