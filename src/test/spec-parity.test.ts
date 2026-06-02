/**
 * Spec parity validator (Phase 24 — UI ↔ JSON ↔ MD).
 *
 * For every showcase slide we assert three things stay in sync:
 *   1. The JSON spec passes the runtime contract (`validateSlide`) — i.e.
 *      every field the renderer reads is present and well-typed, so the UI
 *      can't silently fall back to a TitleSlide or a blank panel.
 *   2. A companion `.md` file exists alongside the `.json` and declares the
 *      same `slideType`, `transition`, and `textAnimation` as the JSON. The
 *      MD is the human-readable design contract — it must not drift.
 *   3. Hard-coded UI exceptions (e.g. `HOME_ICONS` ambient fallback in
 *      `TitleSlide.tsx`) are flagged as warnings so we know which slides
 *      depend on app-side defaults rather than being fully JSON-driven.
 *
 * Failure messages name the file + the exact field that drifted, so a CI
 * red is actionable without opening multiple tabs.
 */
import { describe, it, expect } from 'vitest';
import { validateSlide } from '../slides/contracts';
import { AMBIENT_ICON_REGISTRY } from '../slides/ambientIconRegistry';

// JSON specs — eager so we run in jsdom without `fs`.
const slideJson = import.meta.glob('../../spec/slides/showcase/[0-9]*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

// MD companions — loaded as raw strings so we can grep field declarations.
const slideMd = import.meta.glob('../../spec/slides/showcase/[0-9]*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

/** Pull one `- **Field:** value` declaration out of the MD body. */
function readMdField(md: string, field: string): string | null {
  // Match: - **Field:** value   (optionally with trailing punctuation/notes)
  const re = new RegExp(`-\\s*\\*\\*${field}:\\*\\*\\s*([^\\n]+)`, 'i');
  const m = md.match(re);
  if (!m) return null;
  // First word/token is the canonical value (e.g. "FadeIn" out of
  // "FadeIn (with Bounce overlay)").
  return m[1].trim().split(/\s|—|\(|,/)[0].trim();
}

/** Slide files keyed by their numeric prefix so JSON ↔ MD pair up. */
function pairs() {
  const out: Array<{ key: string; jsonPath: string; mdPath: string | null; json: unknown; md: string | null }> = [];
  for (const [jsonPath, json] of Object.entries(slideJson)) {
    const base = jsonPath.replace(/\.json$/, '');
    const mdPath = `${base}.md`;
    const md = slideMd[mdPath] ?? null;
    out.push({ key: base.split('/').pop()!, jsonPath, mdPath: md ? mdPath : null, json, md });
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

describe('spec parity — UI/JSON/MD must agree per slide', () => {
  const all = pairs();

  it('every JSON spec has a companion MD', () => {
    const orphans = all.filter((p) => p.md === null).map((p) => p.jsonPath);
    expect(orphans, `JSON specs missing a .md companion:\n${orphans.join('\n')}`).toHaveLength(0);
  });

  it('every JSON spec passes the runtime contract (UI-readable)', () => {
    const failures: string[] = [];
    for (const p of all) {
      const r = validateSlide(p.json);
      if (r.ok === true) continue;
      const lines = r.issues.map((i) => `    • ${i.path}: ${i.message}`).join('\n');
      failures.push(`  ${p.jsonPath}\n${lines}`);
    }
    if (failures.length) throw new Error(`Slides that the UI cannot render safely:\n${failures.join('\n\n')}`);
    expect(failures).toHaveLength(0);
  });

  it('MD declares the same slideType / transition / textAnimation as JSON', () => {
    const drifts: string[] = [];
    for (const p of all) {
      if (!p.md) continue;
      const j = p.json as Record<string, unknown>;
      const fields: Array<['Type' | 'Transition' | 'Text animation', string]> = [
        ['Type', String(j.slideType ?? '')],
        ['Transition', String(j.transition ?? '')],
        ['Text animation', String(j.textAnimation ?? '')],
      ];
      for (const [mdField, jsonVal] of fields) {
        const mdVal = readMdField(p.md, mdField);
        if (mdVal === null) continue; // MD doesn't have to declare every field
        // KeywordSlide click-reveal MD writes "KeywordSlide (ClickReveal)" → token compare.
        const mdToken = mdVal.replace(/[^A-Za-z0-9]/g, '');
        const jsonToken = jsonVal.replace(/[^A-Za-z0-9]/g, '');
        if (mdToken !== jsonToken) {
          drifts.push(`  ${p.key}: MD "${mdField}" = "${mdVal}" but JSON = "${jsonVal}"`);
        }
      }
    }
    if (drifts.length) throw new Error(`MD ↔ JSON drift detected:\n${drifts.join('\n')}`);
    expect(drifts).toHaveLength(0);
  });

  it('every authored ambient icon slug resolves in the registry (no silent app-side fallback)', () => {
    const unresolved: string[] = [];
    for (const p of all) {
      const j = p.json as { content?: { titleAmbient?: { iconPool?: string[]; positions?: Array<{ icon: string }> }; stepAmbient?: { iconPool?: string[]; positions?: Array<{ icon: string }> } } };
      const pools: string[][] = [];
      const c = j.content ?? {};
      if (c.titleAmbient?.iconPool) pools.push(c.titleAmbient.iconPool);
      if (c.stepAmbient?.iconPool) pools.push(c.stepAmbient.iconPool);
      if (c.titleAmbient?.positions) pools.push(c.titleAmbient.positions.map((q) => q.icon));
      if (c.stepAmbient?.positions) pools.push(c.stepAmbient.positions.map((q) => q.icon));
      for (const pool of pools) {
        for (const slug of pool) {
          if (!AMBIENT_ICON_REGISTRY[slug]) {
            unresolved.push(`  ${p.key}: ambient icon slug "${slug}" not in AMBIENT_ICON_REGISTRY`);
          }
        }
      }
    }
    if (unresolved.length) throw new Error(`Authored ambient icons missing from registry:\n${unresolved.join('\n')}`);
    expect(unresolved).toHaveLength(0);
  });

  it('reports slides that rely on hard-coded UI fallbacks (advisory)', () => {
    // Non-failing audit. Logs slides whose ambient layer is *not* JSON-authored
    // — they render via app-side defaults (e.g. `HOME_ICONS` in TitleSlide.tsx).
    // Convert to a hard `expect` later if we want JSON authorship to be mandatory.
    const reliant: string[] = [];
    for (const p of all) {
      const j = p.json as { slideType?: string; content?: { titleAmbient?: unknown; stepAmbient?: unknown } };
      if (j.slideType === 'TitleSlide' && !j.content?.titleAmbient) {
        reliant.push(`  ${p.key} (TitleSlide): no titleAmbient → falls back to HOME_ICONS`);
      }
      if (j.slideType === 'StepTimelineSlide' && !j.content?.stepAmbient) {
        reliant.push(`  ${p.key} (StepTimelineSlide): no stepAmbient → falls back to legacy ambient defaults`);
      }
    }
    if (reliant.length) {
      console.warn(`[spec-parity] Slides relying on hard-coded UI fallbacks (advisory):\n${reliant.join('\n')}`);
    }
    expect(true).toBe(true);
  });
});
