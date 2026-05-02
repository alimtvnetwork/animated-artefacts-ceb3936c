/**
 * Regression: TOC sidebar shortcut invariants.
 *
 * 1. `Ctrl+1` / `⌘+1` is the ONLY branch in `SlideDeckPage`'s keydown handler
 *    that calls `toggleToc()`.
 * 2. The `O` / `o` branch in that same handler MUST NOT call `toggleToc()` —
 *    it now belongs to the webcam circle-shape toggle and is gated on the
 *    camera phase. The previous binding (O → TOC) was retired on 2026-05-02
 *    per `mem://features/toc-sidebar`.
 *
 * Static source-code assertions are intentional here: mounting the full
 * `SlideDeckPage` requires the router, deck loader, webcam provider, and
 * <FitStage> measurement — overkill for verifying a keyboard binding contract.
 * If someone adds a sneaky O-branch toggleToc() call, this test catches it
 * the next CI run.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(
  resolve(__dirname, '..', 'pages', 'SlideDeckPage.tsx'),
  'utf8',
);

/** Extract the body of the first if-block whose head matches `headRegex`. */
function extractIfBlock(source: string, headRegex: RegExp): string {
  const m = source.match(headRegex);
  if (!m || m.index === undefined) {
    throw new Error(`No match for ${headRegex} — handler structure changed.`);
  }
  // Walk braces from the first `{` after the match.
  const openIdx = source.indexOf('{', m.index);
  if (openIdx === -1) throw new Error('Block opener not found');
  let depth = 0;
  for (let i = openIdx; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(openIdx, i + 1);
    }
  }
  throw new Error('Block closer not found');
}

describe('TOC sidebar shortcut invariants', () => {
  it('Ctrl+1 / ⌘+1 is the only keydown branch that calls toggleToc()', () => {
    // The handler only ever calls toggleToc() once. The factory definition
    // (`const toggleToc = useCallback(...)`) is unrelated — we count CALLS.
    const callMatches = SRC.match(/\btoggleToc\(\)/g) ?? [];
    expect(callMatches.length).toBe(1);

    // And that one call must live inside the Ctrl/Meta + key === '1' branch.
    const ctrlOneBlock = extractIfBlock(
      SRC,
      /\(e\.ctrlKey \|\| e\.metaKey\)[^{]*e\.key === '1'/,
    );
    expect(ctrlOneBlock).toMatch(/\btoggleToc\(\)/);
  });

  it("the `O` / `o` keydown branch never calls toggleToc()", () => {
    const oBlock = extractIfBlock(
      SRC,
      /\(e\.key === 'o' \|\| e\.key === 'O'\)[^{]*\{/,
    );
    expect(oBlock).not.toMatch(/\btoggleToc\(/);
    // It SHOULD still wire up the webcam circle toggle — sanity check so a
    // future refactor doesn't accidentally null this branch out.
    expect(oBlock).toMatch(/toggleCircleShape\(\)/);
  });

  it('the `O` branch does not toggle the TOC even when phase === on / fullscreen / stage', () => {
    // Smoke check: there is no phase-conditional in the handler that would
    // route an O press into toggleToc(). We assert by ensuring no occurrence
    // of `toggleToc(` appears within 10 lines after the `O`-branch head.
    const idx = SRC.search(/\(e\.key === 'o' \|\| e\.key === 'O'\)/);
    expect(idx).toBeGreaterThan(-1);
    const window = SRC.slice(idx, idx + 600); // ~ next 10–15 lines
    expect(window).not.toMatch(/\btoggleToc\(/);
  });

  it('Ctrl+1 branch is plain (no Shift / Alt) so deck shortcuts never accidentally trigger it', () => {
    // The modifier guards live in the if-head, not the body — match the
    // raw line to assert all four conditions are present together.
    const head = SRC.match(
      /if \(\(e\.ctrlKey \|\| e\.metaKey\)[^)]*e\.key === '1'\)/,
    );
    expect(head).not.toBeNull();
    expect(head![0]).toMatch(/!e\.altKey/);
    expect(head![0]).toMatch(/!e\.shiftKey/);
    // Body must call preventDefault.
    const body = extractIfBlock(
      SRC,
      /\(e\.ctrlKey \|\| e\.metaKey\)[^{]*e\.key === '1'/,
    );
    expect(body).toMatch(/e\.preventDefault\(\)/);
  });
});
