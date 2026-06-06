# Command 05 — Downloaded LLM guide is slide-only + instructs AI to write to filesystem

**Command (verbatim, paraphrased from user):**
"The downloaded LLM guide should ONLY talk about slide information — how the
slide JSON should look, how many slide types there are, how to write multiple
slides in one JSON or output a single slide, how to embed an image / SVG /
base64. The current broader 'how to work' guide content should live in a
memory file instead, not in the download. Also, the guide must tell the AI to
write the JSON file into the filesystem first — and if there is no other
direction for where memory/output files go, default to the `.lovable/` folder."

**Scope:** The downloadable/copyable LLM guide produced by
`src/slides/llmGuideBundle.ts` (`buildLlmGuideMarkdown`), and the
`spec/llm-guideline/00-simplified-single-file-guide.md` source it draws from.

**When it applies:** Any time the LLM-guide download/bundle or the simplified
single-file guide is edited.

**Enforcement rules:**
1. The DOWNLOADED guide contains slide-authoring content ONLY: JSON envelope,
   every `slideType`, single-vs-multi-slide output, image embedding
   (SVG / base64 / data URI), enums, capsule tones. No project workflow,
   `.lovable` process, plan-mode, or "how to work" prose.
2. The broader "how to work / process" material currently embedded in the
   bundle (root `LLM.md` fast-path, guideline process packs) MOVES to a project
   memory file and is REMOVED from the download.
3. The guide MUST instruct the AI to first write its output JSON to the
   filesystem, defaulting to the `.lovable/` folder when no other
   memory/output-location direction is given.
