# LLM-pack reference assets

Mirrored screenshots referenced from the `spec/slides/llm/*.md`
playbooks. Keep this folder self-contained — every image referenced by
a file in `spec/slides/llm/` lives here so the pack survives being
copied somewhere else.

```
assets/
├── step/
│   ├── target.png             ← StepTimeline canonical look (file 02 §1)
│   └── broken-reference.png   ← Anti-pattern to compare against
├── title/
│   ├── riseup-asia-logo.png   ← Brand wordmark (file 04 Part B)
│   └── presenter.png          ← MD ALIM UL KARIM avatar
└── controller/
    └── controller-pill.png    ← Bottom-center pill reference (file 00 §commandment 7)
```

When you commit a new design reference (a new screenshot the user sent,
a new wireframe), drop it here under `{topic}/` and link it from the
relevant playbook.

For the full annotated overlay (every image ↔ playbook section ↔
"what to notice" caption), see [`index.md`](./index.md).
