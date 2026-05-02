---
name: no-readme-txt
description: Never write to readme.txt. All milestone notes / changelog entries go into readme.md instead. readme.txt was renamed to readme.md on 2026-04-26 per user instruction. The "let's start now {date} {time}" milestone marker convention still applies — just write it into readme.md.
type: constraint
---

## Rule

- **Never create or append to `readme.txt`.** It does not exist anymore.
- **All milestone notes go into `readme.md`** at the project root.
- The milestone marker format from user-preferences is unchanged:
  `let's start now {YYYY-MM-DD} {HH:MM}` followed by a `vX.Y.Z — summary` line and a bulleted list of file changes. Malaysia timezone (UTC+8).
- If you ever see a stale instruction (including in `.lovable/user-preferences`) that says "readme.txt", treat it as readme.md. The user is aware the preferences file references the old name; this constraint overrides it.

## Why
User explicitly asked on 2026-04-26: "don't write anything in readme.txt file, update memory regarding this, if anything written transfer to readme.md file." readme.txt was renamed wholesale to readme.md (62 KB of milestone history preserved).
