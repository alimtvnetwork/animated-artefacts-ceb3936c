#!/usr/bin/env bun
/**
 * release-tag-and-build.ts
 *
 * One-click release helper for v1.1.0 (and any future version that matches
 * `package.json#version`). What it does, in order, with a clear log line for
 * every phase so the presenter can read what happened in one glance:
 *
 *   1. Read `package.json` and resolve the target tag (`v<version>`).
 *   2. Verify a git working tree exists and we're not detached/dirty in a
 *      way that would make the tag misleading.
 *   3. Create the annotated tag if it doesn't exist; if it already exists
 *      AND points at HEAD, treat that as success (idempotent re-run).
 *      If it exists and points elsewhere, abort loudly — never silently
 *      move a release tag.
 *   4. Verify the tag: `git tag -l`, `git rev-parse <tag>`, and confirm it
 *      resolves to HEAD.
 *   5. Run `bun run build` and report wall-clock duration + exit code.
 *
 * Usage:  bun run release:tag-and-build
 *         bun run release:tag-and-build --dry-run   # logs only, no writes
 *         bun run release:tag-and-build --force     # move tag if mismatched
 *
 * Exit codes:
 *   0  success (tag exists at HEAD, build green)
 *   1  precondition failed (no git, dirty tree without --force, etc.)
 *   2  tag mismatch (tag exists at a different commit, --force not set)
 *   3  build failed
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/* ---------------- tiny logger ---------------- */
const c = {
  dim:   (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold:  (s: string) => `\x1b[1m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red:   (s: string) => `\x1b[31m${s}\x1b[0m`,
  gold:  (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan:  (s: string) => `\x1b[36m${s}\x1b[0m`,
};
const step = (n: number, label: string) =>
  console.log(`\n${c.gold(`▸ [${n}/5]`)} ${c.bold(label)}`);
const ok   = (msg: string) => console.log(`  ${c.green('✓')} ${msg}`);
const info = (msg: string) => console.log(`  ${c.dim('·')} ${c.dim(msg)}`);
const fail = (msg: string) => console.log(`  ${c.red('✗')} ${msg}`);

/* ---------------- args ---------------- */
const args    = new Set(process.argv.slice(2));
const dryRun  = args.has('--dry-run');
const force   = args.has('--force');

/* ---------------- helpers ---------------- */
function run(cmd: string, argv: string[], opts: { capture?: boolean } = {}) {
  const r = spawnSync(cmd, argv, {
    encoding: 'utf8',
    stdio: opts.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  return {
    code: r.status ?? -1,
    out:  (r.stdout ?? '').trim(),
    err:  (r.stderr ?? '').trim(),
  };
}
const git = (argv: string[], capture = true) => run('git', argv, { capture });

/* ---------------- start ---------------- */
const t0 = Date.now();
console.log(c.bold('\nRiseup Asia · Release tag + build helper'));
console.log(c.dim(`mode: ${dryRun ? 'dry-run' : 'live'}${force ? ' · force' : ''}`));

/* 1. version */
step(1, 'Resolve version from package.json');
const pkgPath = resolve(process.cwd(), 'package.json');
if (!existsSync(pkgPath)) {
  fail('package.json not found at project root'); process.exit(1);
}
const version = JSON.parse(readFileSync(pkgPath, 'utf8')).version as string;
const tag = `v${version}`;
ok(`version = ${c.cyan(version)} → tag = ${c.cyan(tag)}`);

/* 2. git preconditions */
step(2, 'Verify git repository state');
if (git(['rev-parse', '--is-inside-work-tree']).code !== 0) {
  fail('not inside a git work tree'); process.exit(1);
}
const head = git(['rev-parse', 'HEAD']).out;
if (!head) { fail('cannot resolve HEAD'); process.exit(1); }
ok(`HEAD = ${c.dim(head.slice(0, 12))}`);

const status = git(['status', '--porcelain']).out;
if (status) {
  if (force) {
    info(`working tree dirty (--force): \n${status.split('\n').map(l => '    ' + l).join('\n')}`);
  } else {
    fail('working tree is dirty — commit/stash changes or pass --force');
    console.log(status);
    process.exit(1);
  }
} else {
  ok('working tree clean');
}

/* 3. tag */
step(3, `Create annotated tag ${tag}`);
const existing = git(['rev-parse', '-q', '--verify', `refs/tags/${tag}`]);
if (existing.code === 0) {
  const tagSha = existing.out;
  if (tagSha === head) {
    ok(`tag already exists at HEAD (${c.dim(tagSha.slice(0, 12))}) — idempotent re-run`);
  } else if (force) {
    info(`tag exists at ${tagSha.slice(0, 12)} (≠ HEAD) — moving (--force)`);
    if (!dryRun) {
      const del = git(['tag', '-d', tag], false);
      if (del.code !== 0) { fail('failed to delete existing tag'); process.exit(2); }
    }
  } else {
    fail(`tag ${tag} already points at ${tagSha.slice(0, 12)} (≠ HEAD ${head.slice(0, 12)})`);
    fail('refusing to move a release tag silently — re-run with --force if intended');
    process.exit(2);
  }
}

if (existing.code !== 0 || (existing.out !== head && force)) {
  if (dryRun) {
    info(`would run: git tag -a ${tag} -m "Release ${tag}"`);
  } else {
    const create = git(['tag', '-a', tag, '-m', `Release ${tag}`], false);
    if (create.code !== 0) { fail('git tag failed'); process.exit(1); }
    ok(`tag ${tag} created`);
  }
}

/* 4. verify */
step(4, 'Verify tag');
const listed = git(['tag', '-l', tag]).out;
const verifySha = git(['rev-parse', '-q', '--verify', `refs/tags/${tag}^{commit}`]).out;
if (dryRun && existing.code !== 0) {
  info('dry-run: skipping post-create verification');
} else {
  if (listed !== tag) { fail(`git tag -l did not list ${tag}`); process.exit(1); }
  if (verifySha !== head) {
    fail(`tag resolves to ${verifySha.slice(0, 12)} but HEAD is ${head.slice(0, 12)}`);
    process.exit(2);
  }
  ok(`git tag -l → ${listed}`);
  ok(`git rev-parse ${tag} → ${c.dim(verifySha.slice(0, 12))} (= HEAD)`);
}

/* 5. build */
step(5, 'Run production build (bun run build)');
if (dryRun) {
  info('dry-run: skipping build');
  console.log(`\n${c.green('✔')} dry-run complete in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  process.exit(0);
}
const buildStart = Date.now();
const build = run('bun', ['run', 'build']);
const buildSec = ((Date.now() - buildStart) / 1000).toFixed(1);
if (build.code !== 0) {
  fail(`build failed in ${buildSec}s (exit ${build.code})`);
  process.exit(3);
}
ok(`build green in ${c.cyan(buildSec + 's')}`);

console.log(`\n${c.green('✔')} ${c.bold(`Release ${tag} ready`)} — tag verified, build green (${((Date.now() - t0) / 1000).toFixed(1)}s total)`);
process.exit(0);
