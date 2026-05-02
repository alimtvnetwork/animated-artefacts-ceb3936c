# 27b — CodeBlockSlide (LLM Authoring)

> Pack version: v0.181.0. Companion to `06-json-authoring-cheatsheet.md`. Field-by-field authoring contract for `CodeBlockSlide`. If anything here contradicts an older `/spec/slides/NN-*.md`, this file wins.

`CodeBlockSlide` renders a title + hero code block with three highlighting modes (`shiki` / `manual` / `plain`), a copy-to-clipboard button, optional 1-based line numbers, and per-line emphasis with a staggered gold pulse on enter.

Use it when the brief is *"show this code on screen"* — SQL examples, config snippets, API responses, CLI invocations. Don't paste >40 lines; the slide caps readable code at ~30 lines on 1920×1080.

---

## 1. Minimal valid example

```json
{
  "slideNumber": 13,
  "slideName": "sql-example",
  "slideType": "CodeBlockSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "titleStyle": "white",
  "titleShimmer": false,
  "content": {
    "title": "Find recent users",
    "code": "SELECT id, email\nFROM users\nWHERE created_at > '2025-02-01';",
    "codeLanguage": "sql"
  }
}
```

Required by the contract: `title` AND one of (`code` | `codeTokens`).

---

## 2. Required envelope fields

Same as every slideType — see the envelope table in `27a-table-slide.md` §2. `slideType` must be `"CodeBlockSlide"`.

---

## 3. `content.*` — field-by-field

### `title` *(required)*
Short, sentence-case label for what the code does. Keywords-first.

```json
"title": "Find recent users"
```

### `eyebrow` / `subtitle` *(optional)*
As elsewhere — eyebrow is a tiny ALL-CAPS label, subtitle is a single line ≤8 words.

### `code` *(required UNLESS `codeTokens` is set)*
The code body. Newlines preserved as-is. JSON-escape backslashes and quotes.

```json
"code": "const id = crypto.randomUUID();\nawait db.users.insert({ id });"
```

### `codeLanguage` *(optional, default `'plaintext'`)*
Hint for the syntax highlighter. Any shiki-supported id works:
`sql` `json` `ts` `tsx` `js` `jsx` `bash` `python` `rust` `go` `php` `yaml` `html` `css` `diff` `dockerfile`.

```json
"codeLanguage": "ts"
```

### `codeSyntax` *(optional, default `'shiki'`)*

Coloring strategy. Pick one:

| Value | Behavior |
|---|---|
| `'shiki'` (default) | Dynamic-import shiki, render with `github-dark` theme. Best general default. |
| `'manual'` | Ignore `code`; render `codeTokens` line-by-line with `tok-keyword` / `tok-literal` / `tok-comment` classes. Use when you want **deterministic** colors that don't depend on a tokenizer. |
| `'plain'` | No highlighting. Use for `bash` output, `diff` blocks where shiki would mis-color, or short single-color quotes. |

### `codeTokens` *(required when `codeSyntax === 'manual'`)*

Two-dimensional array — outer = lines, inner = inline tokens. Each token has `text` and an optional `kind`:

| `kind` | Class | Color |
|---|---|---|
| `'plain'` (default) | none | `--cream` |
| `'keyword'` | `tok-keyword` | `--gold` |
| `'literal'` | `tok-literal` | `--ember` |
| `'comment'` | `tok-comment` | muted-foreground italic |

```json
"codeSyntax": "manual",
"codeTokens": [
  [
    { "text": "SELECT", "kind": "keyword" },
    { "text": " name, email\n" }
  ],
  [
    { "text": "FROM",   "kind": "keyword" },
    { "text": " users\n" }
  ],
  [
    { "text": "WHERE",  "kind": "keyword" },
    { "text": " created_at > " },
    { "text": "'2025-02-01'", "kind": "literal" },
    { "text": ";" }
  ]
]
```

### `codeHighlightLines` *(optional, v0.180)*

Array of **1-based** line numbers to emphasise. Each emphasised line gets a steady gold backdrop + a 3px inset gold edge AND pulses `0 → 0.32 → 0.14` alpha on enter, staggered 250ms in emphasis-sorted order from 0.55s. Out-of-range entries are silently ignored. `useReducedMotion` suppresses the pulse and keeps only the steady highlight.

```json
"codeHighlightLines": [3]
```

### `codeShowLineNumbers` *(optional)*

Render a left gutter with 1-based numbers. Auto-enables when `codeHighlightLines` is set; defaults `false` otherwise so plain code blocks stay minimal.

```json
"codeShowLineNumbers": true
```

### `codeCopyButton` *(optional, default `true`)*

Top-right copy-to-clipboard chip. Uses `navigator.clipboard.writeText`, switches to a `Check` icon for 1.6s on success, falls back to "Select to copy" when clipboard is unavailable. Set `false` to hide.

```json
"codeCopyButton": false
```

### `codeCaption` *(optional)*

Muted italic line under the code block. When `codeHighlightLines` is set, the runtime appends `· N lines highlighted of M` automatically.

```json
"codeCaption": "Run this in psql against the read replica."
```

### `gridPreset` *(optional, v0.181)*
Pair with `'centered-hero'` for typical hero-code framing.

---

## 4. Worked example — emphasised SQL with shiki

```json
{
  "slideNumber": 13,
  "slideName": "sql-emphasis",
  "slideType": "CodeBlockSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "titleStyle": "white",
  "titleShimmer": false,
  "content": {
    "eyebrow": "QUERY",
    "title": "The predicate matters",
    "code": "SELECT id, email\nFROM users\nWHERE created_at > '2025-02-01'\n  AND verified_at IS NOT NULL;",
    "codeLanguage": "sql",
    "codeHighlightLines": [3, 4],
    "codeCopyButton": true,
    "codeShowLineNumbers": true,
    "codeCaption": "Filter is the whole story."
  }
}
```

---

## 5. Forbidden

- ❌ More than ~30 lines of code (won't fit at legible sizes).
- ❌ `codeTokens` AND `code` both populated when `codeSyntax === 'manual'` (manual mode ignores `code`).
- ❌ Out-of-range `codeHighlightLines` values (silently ignored, but they signal a stale spec).
- ❌ Promoting per-line pulse timing to a content field — locked deck-wide.
- ❌ Using `'plain'` syntax just to avoid filling in `codeLanguage`. Pick the right tool: `'shiki'` for code, `'plain'` only for non-code text.

---

## 6. Companion `.md` brief

Should answer:
1. What does this code do? (one sentence)
2. Which line is the *point* — drives `codeHighlightLines`.
3. Why this language vs. pseudocode.
