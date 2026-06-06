# Command 04 — Single-file slide authoring is the canonical output

**Command (verbatim, paraphrased from user):**
"The AI needs to know all slide formats and examples and deal with them as a
single file. Create another, simplified LLM guide that contains all sample
JSON for every slide type, explains *why* each slide type is used, how it
displays, so an AI can understand and create those JSON slides — as ONE file."

**Scope:** All LLM-facing authoring documentation for this slide deck system.

**When it applies:**
- Whenever `LLM.md` or the `spec/llm-guideline/**` pack is updated.
- The deep `spec/llm-guideline/**` pack stays as the `.lovable`/memory-grade
  "how to work" reference.
- A NEW simplified guide must exist whose job is: one-shot, single-file deck
  authoring + a worked JSON sample for EVERY slide type, with per-type
  "why use this / how it displays" notes.

**Enforcement rules:**
1. The simplified guide MUST state that the AI emits ONE self-contained
   manifest JSON (all slides inlined, images Base64/SVG embedded) — never a
   multi-file split as the deliverable.
2. Every `SlideType` enum value must have a copy-pasteable JSON sample.
3. Each sample must explain purpose, when to choose it, and how it renders.
