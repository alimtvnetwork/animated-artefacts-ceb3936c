#!/usr/bin/env bun
/**
 * scripts/new-deck.ts — One-command "start new deck" scaffolder.
 *
 * Usage:
 *   bun run new <slug> [--name "Deck Name"] [--no-open] [--port 8080]
 *   bun run new my-pitch
 *   bun run new q4-board --name "Q4 Board Update"
 *
 * What it does:
 *   1. Validates `<slug>` (lowercase, kebab-case).
 *   2. Refuses to overwrite an existing spec/slides/<slug>/ folder.
 *   3. Copies every JSON+MD file from spec/slides/showcase/ into
 *      spec/slides/<slug>/ — this gives the author a *full demo* covering
 *      every slide type as a worked example (per user choice v0.149).
 *   4. Rewrites deck.json's `deckSlug` and `deckName` to the new slug/name.
 *   5. Prints next-step instructions including the live URL with `?deck=<slug>`.
 *   6. Opens the browser to that URL (unless --no-open is passed).
 *
 * The dev-time loader (src/slides/loader.ts) discovers any
 * `spec/slides/<slug>/` folder via `import.meta.glob`, so the new deck is
 * live as soon as Vite hot-reloads the file tree. No code edits needed.
 *
 * Exit codes:
 *   0 success
 *   1 generic failure (missing arg, fs error, invalid slug)
 *   2 destination already exists (refused to overwrite)
 *   3 source showcase deck missing (broken project layout)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { platform } from 'node:os';

const REPO_ROOT = resolve(import.meta.dir ?? __dirname, '..');
const SOURCE_DECK_DIR = join(REPO_ROOT, 'spec', 'slides', 'showcase');
const SPEC_SLIDES_DIR = join(REPO_ROOT, 'spec', 'slides');

interface CliArgs {
  slug: string;
  name: string | null;
  open: boolean;
  port: number;
  help: boolean;
}

function printHelp(): void {
  console.log(`
scripts/new-deck.ts — Scaffold a brand-new deck from the showcase template.

Usage:
  bun run new <slug> [options]

Arguments:
  <slug>                  Deck folder name (lowercase kebab-case, e.g. "q4-pitch").

Options:
  --name "<deck name>"    Human-readable deck name (default: derived from slug).
  --port <n>              Dev server port for the open-browser URL (default: 8080).
  --no-open               Don't auto-open the browser.
  -h, --help              Show this help.

Examples:
  bun run new my-pitch
  bun run new q4-board --name "Q4 Board Update"
  bun run new offsite --port 5173 --no-open
`.trim());
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { slug: '', name: null, open: true, port: 8080, help: false };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '-h' || arg === '--help') { args.help = true; continue; }
    if (arg === '--no-open') { args.open = false; continue; }
    if (arg === '--name') { args.name = rest[++i] ?? ''; continue; }
    if (arg === '--port') {
      const n = parseInt(rest[++i] ?? '', 10);
      if (Number.isFinite(n) && n > 0) args.port = n;
      continue;
    }
    if (arg.startsWith('-')) {
      console.error(`Unknown flag: ${arg}\n`);
      printHelp();
      process.exit(1);
    }
    if (!args.slug) args.slug = arg;
  }
  return args;
}

function isValidSlug(slug: string): boolean {
  return /^[a-z][a-z0-9-]{1,48}[a-z0-9]$/.test(slug);
}

function deckNameFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Open a URL in the user's default browser. Best-effort; non-fatal on failure. */
function openBrowser(url: string): void {
  const cmd =
    platform() === 'darwin' ? 'open'
    : platform() === 'win32' ? 'start'
    : 'xdg-open';
  try {
    spawn(cmd, [url], { stdio: 'ignore', detached: true, shell: platform() === 'win32' }).unref();
  } catch {
    // Non-fatal: just log the URL and let the user click it.
  }
}

function main(): void {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); process.exit(0); }

  if (!args.slug) {
    console.error('Error: missing <slug> argument.\n');
    printHelp();
    process.exit(1);
  }

  if (!isValidSlug(args.slug)) {
    console.error(
      `Error: invalid slug "${args.slug}". ` +
      `Slugs must be lowercase kebab-case (e.g. "q4-pitch", "offsite-2026").`,
    );
    process.exit(1);
  }

  if (args.slug === 'showcase') {
    console.error('Error: "showcase" is the canonical demo deck — pick a different slug.');
    process.exit(1);
  }

  if (!existsSync(SOURCE_DECK_DIR)) {
    console.error(
      `Error: source deck not found at ${SOURCE_DECK_DIR}. ` +
      `The project layout looks broken — re-run slides-install.sh / .ps1.`,
    );
    process.exit(3);
  }

  const destDir = join(SPEC_SLIDES_DIR, args.slug);
  if (existsSync(destDir)) {
    console.error(
      `Error: spec/slides/${args.slug}/ already exists. ` +
      `Pick a different slug or delete the existing folder first.`,
    );
    process.exit(2);
  }

  const deckName = (args.name ?? '').trim() || deckNameFromSlug(args.slug);

  // ── Copy every showcase file into the new deck folder ────────────────
  mkdirSync(destDir, { recursive: true });
  const sourceFiles = readdirSync(SOURCE_DECK_DIR);
  let copied = 0;
  for (const file of sourceFiles) {
    if (!file.endsWith('.json') && !file.endsWith('.md')) continue;
    const srcPath = join(SOURCE_DECK_DIR, file);
    const dstPath = join(destDir, file);
    const buf = readFileSync(srcPath, 'utf8');
    writeFileSync(dstPath, buf);
    copied++;
  }

  // ── Patch deck.json with new slug + name ─────────────────────────────
  const deckJsonPath = join(destDir, 'deck.json');
  if (existsSync(deckJsonPath)) {
    const raw = readFileSync(deckJsonPath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    parsed.deckSlug = args.slug;
    parsed.deckName = deckName;
    writeFileSync(deckJsonPath, JSON.stringify(parsed, null, 2) + '\n');
  }

  const url = `http://localhost:${args.port}/1?deck=${args.slug}`;

  // ── Pretty banner ────────────────────────────────────────────────────
  console.log('');
  console.log(`✓ Created deck "${deckName}" at spec/slides/${args.slug}/`);
  console.log(`  • ${copied} files copied from showcase template`);
  console.log(`  • deckSlug:  ${args.slug}`);
  console.log(`  • deckName:  ${deckName}`);
  console.log('');
  console.log('Next steps:');
  console.log(`  1. If the dev server isn't running:  bun run dev`);
  console.log(`  2. Open the deck:                    ${url}`);
  console.log(`  3. Edit slide JSON in:               spec/slides/${args.slug}/`);
  console.log(`  4. Vite hot-reloads on save.`);
  console.log('');

  if (args.open) {
    console.log(`Opening ${url} in your default browser…`);
    openBrowser(url);
  }
}

main();
