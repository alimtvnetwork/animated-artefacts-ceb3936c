# spec/research/ — Pre-implementation research notes

This folder is for **pre-implementation analysis** of features that have
been requested but not yet built. Each research doc must answer:

1. **What is the user actually asking for** (in plain English, with the
   exact verbatim ask quoted at the top).
2. **What does the browser actually let us do** (APIs available, browser
   support matrix, permission model, gotchas).
3. **How would it land in this codebase** (which files, which slide
   type, JSON schema sketch, where the LLM authoring docs would live).
4. **Open questions** the user still needs to answer before
   implementation can start.
5. **Recommended path** with rough effort estimate (S / M / L).

Once a research doc graduates to implementation it gets a companion
`spec/slides/NN-*.md` (runtime contract) and `spec/slides/llm/NN-*.md`
(LLM authoring guide). The research doc itself stays here as the
historical "why we made these decisions" record.

## Index

- `01-webcam-overlay.md` — Browser webcam pinned on slide, with
  per-slide placement, fade/blur entrance, optional zoom + auto-frame.
  Status: **research only**, awaiting user sign-off on JSON shape.
