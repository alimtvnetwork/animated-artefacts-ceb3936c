---
name: LLM.md single shareable guide
description: Downloaded LLM guide is SLIDE-ONLY; root LLM.md holds the process/how-to-work material; AI must write slide JSON to filesystem (default .lovable/) first
type: reference
---

# LLM guide split — slide-only download vs process memory

**Two distinct things, do not merge them:**

1. **Downloaded / copied LLM guide** (`src/slides/llmGuideBundle.ts` →
   `buildLlmGuideMarkdown`): **slide content ONLY**. Sections: filesystem-write
   instruction (§0), active theme tokens, slide JSON schema, enum catalog, and
   the simplified single-file guide (`spec/llm-guideline/00-simplified-single-file-guide.md`).
   It covers the JSON shape, every slide type, single-vs-multi-slide output, and
   image embedding (SVG / Base64 / data URI). It contains **no** project
   workflow, `.lovable` process, or "how to work" prose.

2. **Process / "how to work" material**: stays in the repo (`LLM.md`,
   `spec/llm-guideline/01..10`, `spec/21-slides-system/llm/**`) and is referenced
   from project memory — it is **removed from the download bundle**.

**Mandatory download instruction:** the guide tells the AI to WRITE its slide
JSON to the filesystem first, defaulting to the **`.lovable/`** folder when no
other memory/output location is specified, before reporting results.

**Maintenance:** when slide schema, slideTypes, capsule tones, theme tokens, or
manifest/import rules change, update both the simplified guide and this split so
the download never re-absorbs process content. Captured command:
`.lovable/spec/commands/05-downloaded-guide-slide-only-and-write-to-fs.md`.
