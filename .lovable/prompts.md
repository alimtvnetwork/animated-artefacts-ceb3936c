# Prompts Index

Long-running operating modes and meta-instructions issued by the user.
Each entry links to its full spec in `.lovable/prompts/`.

| # | File | Tags | Status |
|---|------|------|--------|
| 01 | [01-no-questions.md](./prompts/01-no-questions.md) | `no question`, `not ques for 40` | **active** (4/40) |
| 02 | [02-read-memory.md](./prompts/02-read-memory.md) | `read memory`, `onboarding` | always-on (run when user says "read memory") |
| 03 | [03-write-memory.md](./prompts/03-write-memory.md) | `write memory`, `end memory`, `update memory` | always-on (run when user says "write memory") |
| 04 | [04-next-task.md](./prompts/04-next-task.md) | `next task`, `next N steps`, `next task with number` | always-on (canonical reusable driver) |
| 16 | [16-next-task.md](./prompts/16-next-task.md) | `next task (v5)`, `next N steps or tasks`, `next task with number` | latest saved snapshot |

Snapshots `05`–`15` are preserved as historical per-iteration saves of the same recurring next-task prompt.
