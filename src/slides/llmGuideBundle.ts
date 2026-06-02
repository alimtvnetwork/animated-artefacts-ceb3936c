/**
 * LLM guide bundler — concatenates the entire `spec/21-slides-system/llm/`
 * authoring pack + the slide JSON schema + the runtime catalog + the
 * currently-active theme's color tokens into ONE self-contained Markdown
 * document that any LLM can ingest standalone to author new slides for
 * this deck.
 *
 * Triggered from `ControllerHamburger` > "Import / Export" > "Download
 * LLM guide (.md)" or "Copy LLM guide to clipboard". See
 * `mem://features/llm-guide-download`.
 *
 * The bundle is pure source — it never includes the user's actual deck
 * JSON. The point is to give the LLM the *contract*, not the content.
 */

import {
  THEMES,
  DEFAULT_THEME,
  type ThemeId,
  type ThemePreset,
} from './themes';

// ---------------------------------------------------------------------------
// Vite raw glob imports — eager so we can produce the bundle synchronously
// from a click handler. The total spec is ~150 KB markdown; eager-loading
// is cheap and avoids async juggling in the UI.
// ---------------------------------------------------------------------------

const llmMarkdownFiles = import.meta.glob(
  '../../spec/21-slides-system/llm/*.md',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

const guidelineMarkdownFiles = import.meta.glob(
  '../../spec/llm-guideline/*.md',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

const slideSchemaModules = import.meta.glob(
  '../../spec/21-slides-system/slide.schema.json',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

const catalogModules = import.meta.glob(
  '../../spec/21-slides-system/llm/CATALOG.json',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

const slideSchemaRaw = Object.values(slideSchemaModules)[0] ?? '';
const catalogRaw = Object.values(catalogModules)[0] ?? '';

// ---------------------------------------------------------------------------
// Theme inspection
// ---------------------------------------------------------------------------

function getActiveThemeId(): ThemeId {
  if (typeof document === 'undefined') return DEFAULT_THEME;
  const attr = document.documentElement.getAttribute('data-theme') ?? '';
  return attr in THEMES ? (attr as ThemeId) : DEFAULT_THEME;
}

function summarizeTheme(preset: ThemePreset): string {
  const v = preset.vars as Record<string, string>;
  const pick = (k: string) => v[k] ?? '—';
  return [
    `- **Background:** \`hsl(${pick('--background')})\``,
    `- **Foreground:** \`hsl(${pick('--foreground')})\``,
    `- **Gold (primary):** \`hsl(${pick('--gold')})\``,
    `- **Gold glow:** \`hsl(${pick('--gold-glow')})\``,
    `- **Ember (secondary):** \`hsl(${pick('--ember')})\``,
    `- **Cream (light text):** \`hsl(${pick('--cream')})\``,
    `- **Card surface:** \`hsl(${pick('--card')})\``,
    `- **Capsule colors:** gold / ember / cream / ink / outline / mint / sky / violet / rose`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface LlmGuideBuildOptions {
  /** Optional deck name for the front-matter (purely descriptive). */
  deckName?: string;
}

/**
 * Produces the full Markdown bundle as a single string.
 *
 * Section order (per `mem://features/llm-guide-download`):
 *   1. Front-matter preamble with date, deck, active themeId.
 *   2. Active theme's ThemePreset JSON + human summary.
 *   3. slide.schema.json (authoritative).
 *   4. CATALOG.json (enumerated values).
 *   5. All `spec/21-slides-system/llm/*.md` in numeric order.
 *   6. Authoring footer.
 */
export function buildLlmGuideMarkdown(opts: LlmGuideBuildOptions = {}): string {
  const themeId = getActiveThemeId();
  const preset = THEMES[themeId] ?? THEMES[DEFAULT_THEME];
  const date = new Date().toISOString().slice(0, 10);
  const deckName = opts.deckName ?? 'Riseup Asia LLC slide deck';

  const concat = (files: Record<string, string>): string =>
    Object.keys(files)
      .sort((a, b) => a.localeCompare(b))
      .map((path) => {
        const filename = path.split('/').pop() ?? path;
        const body = files[path] ?? '';
        return `\n\n---\n\n## File: \`${filename}\`\n\n${body.trim()}\n`;
      })
      .join('');

  const llmFiles = concat(llmMarkdownFiles);
  const guidelineFiles = concat(guidelineMarkdownFiles);

  const themeSummary = summarizeTheme(preset);
  const themeJson = JSON.stringify(preset, null, 2);

  return `# LLM Slide-Authoring Guide
> Self-contained kit for authoring new slides for **${deckName}**.
> Paste this entire document into any LLM (ChatGPT, Claude, Gemini, …) and
> ask it to produce one slide JSON file per slide. The schema, enums,
> design tokens, and step-by-step recipes below are the complete contract.

\`\`\`yaml
generated:    ${date}
deck:         ${deckName}
themeId:      ${themeId}
themeName:    ${preset.label ?? themeId}
schemaSource: spec/21-slides-system/slide.schema.json
catalogSource: spec/21-slides-system/llm/CATALOG.json
\`\`\`

---

## 1 · Active theme & color tokens

The deck is currently rendered with the **\`${themeId}\`** theme. Any new
slide JSON you produce will be rendered against these tokens — design and
copy decisions should anticipate them.

### Quick palette

${themeSummary}

### Full \`ThemePreset\` (authoritative)

\`\`\`json
${themeJson}
\`\`\`

> **Rule:** never write raw hex values in slide JSON. Use semantic enums
> (\`capsuleColor: "gold" | "ember" | "cream" | …\`) — the runtime maps
> them to the tokens above so theme switches stay visually coherent.

---

## 2 · Slide JSON schema

Authoritative JSON Schema. Every slide JSON file you emit MUST validate
against this. Required fields, enum values, and nested object shapes are
all enforced at deck-load time.

\`\`\`json
${slideSchemaRaw.trim()}
\`\`\`

---

## 3 · Runtime catalog (enumerated values)

Machine-readable mirror of \`spec/21-slides-system/llm/28-component-and-animation-catalog.md\`.
Lists every legal value for \`slideType\`, \`transition\`, \`textAnimation\`,
\`capsuleColor\`, \`expandAnimation\`, and step motion variants. **Never
invent enum values that aren't in this catalog** — the loader will reject
them.

\`\`\`json
${catalogRaw.trim()}
\`\`\`

---

## 4 · Authoring pack — \`spec/21-slides-system/llm/\`

The remainder of this document is every Markdown file from the canonical
LLM authoring pack, concatenated in numeric order. Read \`00-readme.md\`
first; the rest is reference material referenced from there.
${llmFiles}

---

## 5 · What to output

When the human asks you to author a slide:

1. **One JSON file per slide.** Filename pattern: \`NN-kebab-case-name.json\`
   where \`NN\` is the slide number (zero-padded to 2 digits).
2. **Validate against the schema** in §2 mentally before responding. Required
   fields by \`slideType\` are spelled out in \`23-slide-type-contracts.md\`.
3. **Keywords-only content rule** — slides are visual anchors, NOT
   paragraphs. The presenter narrates; the slide shows 3-7 keywords or
   capsules. Never write prose blocks into \`content.body\` etc.
4. **Use enum values, never hex colors.** Theme tokens already encode the
   visual identity (see §1).
5. **Pick from the catalog** in §3 for transitions, text animations,
   capsule colors, and step motion variants. Vary them across the deck —
   monotony is a smell.

---

*End of LLM guide. ${Object.keys(llmMarkdownFiles).length} pack files +
schema + catalog + theme \`${themeId}\` bundled on ${date}.*
`;
}

/**
 * Trigger a browser download of the bundle. Returns the filename used.
 */
export function downloadLlmGuide(opts: LlmGuideBuildOptions = {}): string {
  const md = buildLlmGuideMarkdown(opts);
  const themeId = getActiveThemeId();
  const date = new Date().toISOString().slice(0, 10);
  const filename = `riseup-llm-slide-guide_${themeId}_${date}.md`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revoke — some browsers race the click handler.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

/**
 * Copy the bundle to the clipboard. Resolves to true on success.
 */
export async function copyLlmGuideToClipboard(
  opts: LlmGuideBuildOptions = {},
): Promise<boolean> {
  const md = buildLlmGuideMarkdown(opts);
  try {
    await navigator.clipboard.writeText(md);
    return true;
  } catch {
    return false;
  }
}
