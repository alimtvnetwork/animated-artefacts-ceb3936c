# Prompts — Top-Level Pointer

This file is the canonical entry point to the project's reusable operating
prompts. The full registry lives at **[.lovable/prompts.md](./prompts.md)**;
each prompt has its full spec in **`.lovable/prompts/`**.

| # | File | Trigger phrases | Status |
|---|------|-----------------|--------|
| 01 | [prompts/01-no-questions.md](./prompts/01-no-questions.md) | `no question`, `not ques for 40` | active (4/40) |
| 02 | [prompts/02-read-memory.md](./prompts/02-read-memory.md) | `read memory`, `onboarding` | always-on |
| 03 | [prompts/03-write-memory.md](./prompts/03-write-memory.md) | `write memory`, `end memory`, `update memory` | always-on |
| 04 | [prompts/04-next-task.md](./prompts/04-next-task.md) | `next task`, `next N steps`, `next task with number` | always-on (canonical reusable driver) |
| 16 | [prompts/16-next-task.md](./prompts/16-next-task.md) | `next task (v5)`, `next N steps or tasks`, `next task with number` | latest saved snapshot |

> Project layout reconciliation: this repo uses `.lovable/prompts.md` as the
> registry index (not `prompts/index.md`) and `.lovable/memory/` (never
> `memories/`). The generic "Write Memory" template's paths are mapped to the
> real project locations inside `prompts/03-write-memory.md`.
