---
name: ci-strict-types
description: GitHub Actions CI (.github/workflows/ci.yml) hard-fails on tsc errors, explicit `any` (ESLint + grep guard), ESLint errors, failing tests, or build failures. As of v0.170 TypeScript runs in full `strict: true` mode (incl. noImplicitAny + strictNullChecks). `any` is banned; `unknown` is allowed.
type: feature
---

## What
v0.115 added a strict-types CI workflow.
v0.170 flipped TypeScript itself to full strict mode.

## Workflow
`.github/workflows/ci.yml` — single job `typecheck-and-lint`:
1. `bun install --frozen-lockfile`
2. `bunx tsc -p tsconfig.app.json --noEmit` + same for `tsconfig.node.json`. **No `--strict` CLI flag** — strictness lives in the project files so a green local typecheck means the exact same thing as a green CI typecheck.
3. **Grep guard**: fails on `: any`, `<any>`, `as any` in `src/**` (excluding `src/components/ui/**` and `src/test/**`). Catches violations even if a developer disables the ESLint rule on a single line.
4. `bun run lint` (ESLint with `@typescript-eslint/no-explicit-any: error`)
5. `bun run test` (Vitest)
6. `bun run build`

## TypeScript strict config (v0.170)
Both `tsconfig.app.json` AND root `tsconfig.json` set:
- `"strict": true` (enables the full strict family)
- `"noImplicitAny": true` (explicit, even though strict implies it — locks intent)
- `"strictNullChecks": true` (explicit, same reason)

The root config exists so editors and ad-hoc `bunx tsc --noEmit` calls from the repo root see identical rules to CI. `tsconfig.app.json` is the source of truth CI invokes.

If you change strictness, change it ONLY in those two project files — **never** as a `--strict`/`--no-strict` CLI override. That's what \"the harness uses the exact same tsconfig as local typecheck\" means in this repo.

## ESLint config (`eslint.config.js`)

**Base layer (all `**/*.{ts,tsx}`):**
- `@typescript-eslint/no-explicit-any: error`
- `@typescript-eslint/no-unsafe-function-type: error`
- `@typescript-eslint/no-wrapper-object-types: error`
- `@typescript-eslint/ban-ts-comment: error` (allow `ts-expect-error` only with description)

**Typed-linting layer (v0.171, `src/**/*.{ts,tsx}`, excludes `src/components/ui/**` + `src/test/**`):**
Requires `parserOptions.project: ./tsconfig.app.json`. Forces narrowing before any unsafe access on `unknown`:
- `@typescript-eslint/no-unsafe-assignment: error`
- `@typescript-eslint/no-unsafe-member-access: error`
- `@typescript-eslint/no-unsafe-call: error`
- `@typescript-eslint/no-unsafe-return: error`

`catch (e: unknown)` is **not** auto-exempted by ESLint — instead use the sanctioned helpers in `src/lib/errors.ts` (`errorMessage(e)`, `toError(e)`, `isError(e)`). They narrow internally so call sites stay clean.

Tests + `src/components/ui/**` are exempt (shadcn primitives have intentional `any` in their generated types; test fixtures need `any` for negative-path cases).

## Policy: `any` vs `unknown`
- **`any` banned hard** — it's the unsafe escape hatch.
- **`unknown` allowed** — type-safe, forces narrowing. Use for genuinely-unknown payloads (parsed JSON, caught errors, cross-window messages, third-party data) and narrow at the boundary with a type guard or Zod `.parse()`.

**Canonical contributor guide: [`spec/architecture/typescript-unknown-policy.md`](../../../spec/architecture/typescript-unknown-policy.md)** — examples for `catch (e)`, runtime validation, cross-context messages; reviewer checklist; rationale for not auto-banning `unknown`.

There were 0 `any` and 16 `unknown` usages in authored source at v0.115 ship time. The `unknown` count is documented as acceptable.

## Concurrency
`concurrency: ci-${{ github.ref }}` with `cancel-in-progress: true` — new pushes cancel stale runs.

## When to update
- Adding a new strict rule: bump it in `eslint.config.js` AND make sure the local `bun run lint` passes before shipping.
- Adding a new package script: wire it into the CI step list.
