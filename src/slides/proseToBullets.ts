/**
 * Shared keyword-splitter for legacy `description.body` prose.
 *
 * Used by:
 *  - the runtime loader preprocessor (`src/slides/normalize3DBullets.ts`),
 *    which migrates older deck JSON before schema validation;
 *  - the builder editor (`src/builder/ContentFieldEditor.tsx`), which
 *    offers an "Convert to bullets" action and a one-shot legacy import
 *    when a 3D step is opened with prose still in `body`.
 *
 * Splits on `.`, `;`, `,`, and newlines; trims each fragment, drops
 * empties, and caps at 6 entries to honour the StepsChain3D contract.
 * Behaviour is intentionally identical across both call sites so an
 * author can't observe a different bullet split between "what the loader
 * migrated" and "what the editor would have produced".
 */
export function splitProseToBullets(prose: string): string[] {
  return prose
    .split(/[.;,\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}
