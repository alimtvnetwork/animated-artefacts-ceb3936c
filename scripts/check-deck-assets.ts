#!/usr/bin/env bun
/**
 * Build-time asset existence check.
 *
 * Reads a deck.json and verifies every URL declared
 * under `deck.assets.{audio,qr,brand}` resolves to a real file on disk —
 * either under `public/` (served as-is by Vite) or via an importable
 * module under `src/`. Icons are skipped because they're React component
 * registrations, not files; their existence is type-checked at compile
 * time.
 *
 * Why this is separate from the runtime validator:
 *   - Catches bundled-deck typos in CI before they hit a user's browser.
 *   - Zero runtime cost — the boot path stays fast.
 *   - Doesn't need Vite's dev server running, so it's safe in tightly-
 *     scoped CI containers (no port collisions, no headless browser).
 *
 * Usage:
 *   bun run scripts/check-deck-assets.ts <path-to-deck>
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, posix } from 'node:path';
import process from 'node:process';

interface DeckShape {
  deckSlug?: string;
  assets?: {
    audio?: Record<string, string>;
    qr?: Record<string, string>;
    brand?: Record<string, string>;
    icons?: Record<string, string>;
  };
}

const REPO_ROOT = process.cwd();

interface Failure {
  /** Where the URL was declared, e.g. `assets.audio.whoosh`. */
  key: string;
  url: string;
  reason: string;
}

/**
 * Verify a URL points at a real, servable file. Vite serves `/public/*`
 * at the root, so a deck URL like "/sounds/foo.mp3" is expected to
 * exist at <repo>/public/sounds/foo.mp3. URLs starting with `http(s)://`
 * are treated as opaque (we don't fetch in build-time CI) — they're
 * the author's responsibility.
 */
function checkUrl(key: string, url: string): Failure | null {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return null;
  }
  if (!url.startsWith('/')) {
    return {
      key,
      url,
      reason: `URL must be absolute (start with "/") or http(s)://; got "${url}".`,
    };
  }
  // `posix.join` keeps the resolved path POSIX-style on Windows so the
  // failure message matches what the author sees in their JSON.
  const fsPath = resolve(REPO_ROOT, 'public' + url);
  if (!existsSync(fsPath)) {
    return {
      key,
      url,
      reason: `File not found at ${posix.join('public', url)}.`,
    };
  }
  return null;
}

function main(): number {
  const deckPath = process.argv[2];
  if (!deckPath) {
    console.error('Usage: bun run scripts/check-deck-assets.ts <path-to-deck.json>');
    return 1;
  }

  const fullPath = resolve(REPO_ROOT, deckPath);
  if (!existsSync(fullPath)) {
    console.error(`✗ Deck not found: ${deckPath}`);
    return 1;
  }

  let deck: DeckShape;
  try {
    deck = JSON.parse(readFileSync(fullPath, 'utf8')) as DeckShape;
  } catch (err) {
    console.error(`✗ Failed to parse ${deckPath}: ${(err as Error).message}`);
    return 1;
  }

  const assets = deck.assets;
  if (!assets) {
    console.error(`✗ ${deckPath} has no "assets" block.`);
    return 1;
  }

  const failures: Failure[] = [];
  for (const category of ['audio', 'qr', 'brand'] as const) {
    const block = assets[category];
    if (!block) continue;
    for (const [slug, url] of Object.entries(block)) {
      const f = checkUrl(`assets.${category}.${slug}`, url);
      if (f) failures.push(f);
    }
  }

  const summary = `${deck.deckSlug ?? deckPath} · ${
    Object.keys(assets.audio ?? {}).length
  } audio · ${Object.keys(assets.qr ?? {}).length} qr · ${
    Object.keys(assets.brand ?? {}).length
  } brand · ${Object.keys(assets.icons ?? {}).length} icons`;

  if (failures.length === 0) {
    console.log(`✓ Deck assets OK — ${summary}`);
    return 0;
  }

  console.error(`✗ Deck asset check failed — ${summary}`);
  console.error(`  ${failures.length} broken URL${failures.length === 1 ? '' : 's'}:\n`);
  for (const f of failures) {
    console.error(`  • ${f.key}`);
    console.error(`      url:    ${f.url}`);
    console.error(`      reason: ${f.reason}`);
  }
  console.error(
    `\nFix the deck JSON or move the assets into public/. ` +
      `URLs are resolved relative to the public/ folder.`,
  );
  return 1;
}

process.exit(main());
