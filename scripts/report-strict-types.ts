/**
 * Strict-types dashboard report.
 *
 * Local-only — no CI, no UI. Run with `bun run report:strict`.
 *
 * Counts:
 *   1. TypeScript strict errors           (`bunx tsc -p tsconfig.app.json --noEmit`)
 *   2. ESLint errors of interest          (`bun run lint --format json`)
 *        - @typescript-eslint/no-explicit-any
 *        - @typescript-eslint/no-unsafe-assignment
 *        - @typescript-eslint/no-unsafe-member-access
 *        - @typescript-eslint/no-unsafe-call
 *        - @typescript-eslint/no-unsafe-return
 *   3. `unknown` declarations in src/**   (informational — unknown is allowed)
 *
 * Output:
 *   - Pretty dashboard printed to stdout (per-file breakdown + totals + trend
 *     vs last entry).
 *   - Appends an entry to `metrics/strict-types-history.json` so trends survive
 *     across runs. Idempotent on the same git SHA: re-running on the same SHA
 *     replaces the most recent entry instead of duplicating.
 *
 * History entry shape:
 *   {
 *     timestamp: ISO string,
 *     sha: short git SHA (or "uncommitted"),
 *     totals: { tscErrors, eslintErrors, unknownUsages },
 *     byFile: {
 *       tscErrors: Record<filePath, number>,
 *       eslintErrors: Record<filePath, number>,
 *       unknownUsages: Record<filePath, number>,
 *     },
 *   }
 *
 * Policy companion: spec/architecture/typescript-unknown-policy.md
 *                   .lovable/memory/features/ci-strict-types.md
 */

import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

interface Counts {
  tscErrors: number;
  eslintErrors: number;
  unknownUsages: number;
}

interface ByFile {
  tscErrors: Record<string, number>;
  eslintErrors: Record<string, number>;
  unknownUsages: Record<string, number>;
}

/** rule id → file → count */
type ByRuleByFile = Record<string, Record<string, number>>;

interface HistoryEntry {
  timestamp: string;
  sha: string;
  totals: Counts;
  byFile: ByFile;
  /** Per-rule totals across the repo (only the TRACKED_ESLINT_RULES). */
  eslintByRule?: Record<string, number>;
  /** Per-rule, per-file breakdown of ESLint violations. */
  eslintByRuleByFile?: ByRuleByFile;
}

interface ESLintMessage {
  ruleId: string | null;
}

interface ESLintFileResult {
  filePath: string;
  messages: ESLintMessage[];
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

const REPO_ROOT = resolve(__dirname, "..");
const HISTORY_PATH = join(REPO_ROOT, "metrics", "strict-types-history.json");
const TRACKED_ESLINT_RULES = new Set([
  "@typescript-eslint/no-explicit-any",
  "@typescript-eslint/no-unsafe-assignment",
  "@typescript-eslint/no-unsafe-member-access",
  "@typescript-eslint/no-unsafe-call",
  "@typescript-eslint/no-unsafe-return",
]);

function gitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: REPO_ROOT, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "uncommitted";
  }
}

function rel(p: string): string {
  return relative(REPO_ROOT, p).replaceAll("\\", "/");
}

function bumpFile(map: Record<string, number>, file: string, by = 1): void {
  map[file] = (map[file] ?? 0) + by;
}

// ──────────────────────────────────────────────────────────────────────────
// 1. tsc strict errors
// ──────────────────────────────────────────────────────────────────────────

function runTsc(): { count: number; byFile: Record<string, number> } {
  const result = spawnSync("bunx", ["tsc", "-p", "tsconfig.app.json", "--noEmit", "--pretty", "false"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  const out = (result.stdout ?? "") + (result.stderr ?? "");
  const byFile: Record<string, number> = {};
  // tsc lines look like:  src/foo/bar.ts(12,34): error TS2322: ...
  const re = /^([^()\n]+)\((\d+),(\d+)\): error TS\d+:/gm;
  let count = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(out)) !== null) {
    count++;
    bumpFile(byFile, m[1].replaceAll("\\", "/"));
  }
  return { count, byFile };
}

// ──────────────────────────────────────────────────────────────────────────
// 2. ESLint errors (only the rules we care about)
// ──────────────────────────────────────────────────────────────────────────

function runEslint(): {
  count: number;
  byFile: Record<string, number>;
  byRule: Record<string, number>;
  byRuleByFile: ByRuleByFile;
} {
  const result = spawnSync("bunx", ["eslint", ".", "--format", "json"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  const raw = result.stdout ?? "";
  const byFile: Record<string, number> = {};
  const byRule: Record<string, number> = {};
  const byRuleByFile: ByRuleByFile = {};
  // Seed every tracked rule so the dashboard always lists them, even at zero.
  for (const ruleId of TRACKED_ESLINT_RULES) {
    byRule[ruleId] = 0;
    byRuleByFile[ruleId] = {};
  }
  let count = 0;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { count: 0, byFile, byRule, byRuleByFile };
  }
  if (!Array.isArray(parsed)) return { count: 0, byFile, byRule, byRuleByFile };
  for (const fileResultRaw of parsed) {
    if (!fileResultRaw || typeof fileResultRaw !== "object") continue;
    const fileResult = fileResultRaw as ESLintFileResult;
    if (!Array.isArray(fileResult.messages)) continue;
    const relPath = rel(fileResult.filePath);
    let n = 0;
    for (const msg of fileResult.messages) {
      if (msg && typeof msg === "object" && msg.ruleId && TRACKED_ESLINT_RULES.has(msg.ruleId)) {
        n++;
        byRule[msg.ruleId] = (byRule[msg.ruleId] ?? 0) + 1;
        bumpFile(byRuleByFile[msg.ruleId], relPath);
      }
    }
    if (n > 0) {
      byFile[relPath] = n;
      count += n;
    }
  }
  return { count, byFile, byRule, byRuleByFile };
}

// ──────────────────────────────────────────────────────────────────────────
// 3. `unknown` usages in src/** (informational)
// ──────────────────────────────────────────────────────────────────────────

const UNKNOWN_RE = /\bunknown\b/g;

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function countUnknown(): { count: number; byFile: Record<string, number> } {
  const root = join(REPO_ROOT, "src");
  const byFile: Record<string, number> = {};
  let total = 0;
  if (!existsSync(root)) return { count: 0, byFile };
  for (const file of walk(root)) {
    // Skip shadcn primitives + tests for parity with the lint config carve-outs.
    if (file.includes("/components/ui/") || /\.test\.(ts|tsx)$/.test(file)) continue;
    const src = readFileSync(file, "utf8");
    // Strip line + block comments and strings to avoid false positives like
    // "unknown error" in a message.
    const stripped = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "")
      .replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '""');
    const matches = stripped.match(UNKNOWN_RE);
    if (matches && matches.length > 0) {
      byFile[rel(file)] = matches.length;
      total += matches.length;
    }
  }
  return { count: total, byFile };
}

// ──────────────────────────────────────────────────────────────────────────
// History
// ──────────────────────────────────────────────────────────────────────────

function loadHistory(): HistoryEntry[] {
  if (!existsSync(HISTORY_PATH)) return [];
  try {
    const raw: unknown = JSON.parse(readFileSync(HISTORY_PATH, "utf8"));
    return Array.isArray(raw) ? (raw as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  mkdirSync(dirname(HISTORY_PATH), { recursive: true });
  writeFileSync(HISTORY_PATH, JSON.stringify(entries, null, 2) + "\n", "utf8");
}

// ──────────────────────────────────────────────────────────────────────────
// Pretty print
// ──────────────────────────────────────────────────────────────────────────

const c = {
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
};

function delta(now: number, prev: number | undefined): string {
  if (prev === undefined) return c.dim("(first run)");
  const d = now - prev;
  if (d === 0) return c.dim("(no change)");
  if (d < 0) return c.green(`(${d})`);
  return c.red(`(+${d})`);
}

function printSection(title: string, total: number, prev: number | undefined, byFile: Record<string, number>): void {
  const colored = total === 0 ? c.green(String(total)) : c.red(String(total));
  console.log(`\n${c.bold(title)}: ${colored} ${delta(total, prev)}`);
  const entries = Object.entries(byFile).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    console.log(c.dim("  (none)"));
    return;
  }
  for (const [file, n] of entries.slice(0, 15)) {
    console.log(`  ${String(n).padStart(4)}  ${file}`);
  }
  if (entries.length > 15) {
    console.log(c.dim(`  ... and ${entries.length - 15} more files`));
  }
}

/** Short, readable label for each tracked ESLint rule. */
const RULE_LABEL: Record<string, string> = {
  "@typescript-eslint/no-explicit-any": "no-explicit-any           (any-ban)",
  "@typescript-eslint/no-unsafe-assignment": "no-unsafe-assignment      (unknown-narrowing)",
  "@typescript-eslint/no-unsafe-member-access": "no-unsafe-member-access   (unknown-narrowing)",
  "@typescript-eslint/no-unsafe-call": "no-unsafe-call            (unknown-narrowing)",
  "@typescript-eslint/no-unsafe-return": "no-unsafe-return          (unknown-narrowing)",
};

/**
 * Per-rule breakdown: for each tracked rule, print its total and the top
 * offending files. Lets a reviewer immediately see "8 any-ban violations
 * in src/foo.ts, 3 no-unsafe-call in src/bar.ts" etc.
 */
function printRuleBreakdown(
  byRule: Record<string, number>,
  byRuleByFile: ByRuleByFile,
  prevByRule: Record<string, number> | undefined,
): void {
  console.log(`\n${c.bold("ESLint per-rule breakdown")} ${c.dim("(any-ban + unknown-narrowing)")}`);
  // Stable order: any-ban first, then unsafe-* alphabetically.
  const order = [
    "@typescript-eslint/no-explicit-any",
    "@typescript-eslint/no-unsafe-assignment",
    "@typescript-eslint/no-unsafe-call",
    "@typescript-eslint/no-unsafe-member-access",
    "@typescript-eslint/no-unsafe-return",
  ];
  for (const ruleId of order) {
    const total = byRule[ruleId] ?? 0;
    const label = RULE_LABEL[ruleId] ?? ruleId;
    const colored = total === 0 ? c.green(String(total)) : c.red(String(total));
    console.log(`\n  ${c.bold(label)}: ${colored} ${delta(total, prevByRule?.[ruleId])}`);
    const files = Object.entries(byRuleByFile[ruleId] ?? {}).sort((a, b) => b[1] - a[1]);
    if (files.length === 0) {
      console.log(c.dim("    (none)"));
      continue;
    }
    for (const [file, n] of files.slice(0, 10)) {
      console.log(`    ${String(n).padStart(4)}  ${file}`);
    }
    if (files.length > 10) {
      console.log(c.dim(`    ... and ${files.length - 10} more files`));
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

function main(): void {
  console.log(c.bold(c.cyan("\n📊 Strict-types dashboard\n")));
  console.log(c.dim("Running tsc, eslint, and unknown scan..."));

  const tsc = runTsc();
  const eslint = runEslint();
  const unk = countUnknown();

  const history = loadHistory();
  const last = history.length > 0 ? history[history.length - 1] : undefined;
  const sha = gitSha();

  const entry: HistoryEntry = {
    timestamp: new Date().toISOString(),
    sha,
    totals: {
      tscErrors: tsc.count,
      eslintErrors: eslint.count,
      unknownUsages: unk.count,
    },
    byFile: {
      tscErrors: tsc.byFile,
      eslintErrors: eslint.byFile,
      unknownUsages: unk.byFile,
    },
    eslintByRule: eslint.byRule,
    eslintByRuleByFile: eslint.byRuleByFile,
  };

  printSection("TS strict errors (tsc)", tsc.count, last?.totals.tscErrors, tsc.byFile);
  printSection("ESLint errors (no-explicit-any + no-unsafe-*)", eslint.count, last?.totals.eslintErrors, eslint.byFile);
  printRuleBreakdown(eslint.byRule, eslint.byRuleByFile, last?.eslintByRule);
  console.log(`\n${c.bold("`unknown` usages")} ${c.dim("(informational — unknown is allowed)")}: ${c.cyan(String(unk.count))} ${delta(unk.count, last?.totals.unknownUsages)}`);
  const unkEntries = Object.entries(unk.byFile).sort((a, b) => b[1] - a[1]);
  for (const [file, n] of unkEntries.slice(0, 10)) {
    console.log(`  ${String(n).padStart(4)}  ${file}`);
  }
  if (unkEntries.length > 10) {
    console.log(c.dim(`  ... and ${unkEntries.length - 10} more files`));
  }

  // Idempotent on the same SHA: replace the most-recent entry.
  if (last && last.sha === sha && sha !== "uncommitted") {
    history[history.length - 1] = entry;
  } else {
    history.push(entry);
  }
  saveHistory(history);

  console.log(`\n${c.dim(`History: ${rel(HISTORY_PATH)} (${history.length} entries)`)}`);
  console.log(`${c.dim(`SHA: ${sha} • ${entry.timestamp}`)}\n`);

  // Exit non-zero if there are real (non-informational) violations so callers
  // can chain it into pre-commit hooks if they want.
  if (tsc.count > 0 || eslint.count > 0) {
    process.exit(1);
  }
}

main();
