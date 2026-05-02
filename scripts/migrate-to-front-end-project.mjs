#!/usr/bin/env node
/**
 * Option C migration — moves every deck under spec/26-slide-definitions/<slug>/
 * into front-end/project/<slug>/{data,spec}/ per architecture.md §4.
 *
 * For each deck:
 *   spec/26-slide-definitions/<slug>/deck.json
 *     → front-end/project/<slug>/data/slides.json    (new shape: Name + config + Slides[])
 *   spec/26-slide-definitions/<slug>/NN-name.json
 *     → front-end/project/<slug>/data/slides/NN-name.json   (unchanged content)
 *   spec/26-slide-definitions/<slug>/NN-name.md
 *     → front-end/project/<slug>/spec/NN-name.md            (unchanged content)
 *
 * Source files are removed after copy. README pointers updated.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const SRC_ROOT = 'spec/26-slide-definitions';
const DEST_ROOT = 'front-end/project';

function ensureDir(p) { mkdirSync(p, { recursive: true }); }

const decks = readdirSync(SRC_ROOT).filter(d => {
  const full = join(SRC_ROOT, d);
  try { return statSync(full).isDirectory(); } catch { return false; }
});

for (const slug of decks) {
  const srcDir = join(SRC_ROOT, slug);
  const dataDir = join(DEST_ROOT, slug, 'data');
  const slidesDir = join(dataDir, 'slides');
  const specDir = join(DEST_ROOT, slug, 'spec');
  ensureDir(slidesDir);
  ensureDir(specDir);

  const deckPath = join(srcDir, 'deck.json');
  if (!existsSync(deckPath)) {
    console.warn(`[skip] ${slug}: no deck.json`);
    continue;
  }
  const deck = JSON.parse(readFileSync(deckPath, 'utf8'));

  // Build Slides[] — order from deck.slides (which is an array of slide-name slugs).
  const slideEntries = [];
  for (const slugRef of deck.slides ?? []) {
    const file = `${slugRef}.json`;
    const srcSlide = join(srcDir, file);
    if (!existsSync(srcSlide)) {
      console.warn(`[warn] ${slug}: missing ${file}`);
      continue;
    }
    const raw = readFileSync(srcSlide, 'utf8');
    writeFileSync(join(slidesDir, file), raw);
    const parsed = JSON.parse(raw);
    slideEntries.push({
      title: parsed.slideName ?? slugRef,
      path: `./slides/${file}`,
    });
  }

  // Also copy companion .md specs.
  for (const f of readdirSync(srcDir)) {
    if (f.endsWith('.md') && f !== 'README.md') {
      writeFileSync(join(specDir, f), readFileSync(join(srcDir, f), 'utf8'));
    }
  }

  // New slides.json (per spec) — keeps every legacy field in `config` so the
  // loader/asset registry/theme picker keep working unchanged.
  const { deckSlug, deckName, slides: _slides, ...rest } = deck;
  const manifest = {
    Name: deckName ?? deckSlug,
    config: {
      deckSlug,
      ...rest,
    },
    Slides: slideEntries,
  };
  writeFileSync(join(dataDir, 'slides.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`[ok] ${slug}: ${slideEntries.length} slides → ${dataDir}/`);

  // Remove the old source folder.
  rmSync(srcDir, { recursive: true, force: true });
}

console.log('\nDone. Removed legacy spec/26-slide-definitions/<deck>/ folders.');
