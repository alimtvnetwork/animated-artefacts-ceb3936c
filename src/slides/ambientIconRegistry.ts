/**
 * JSON-safe ambient icon registry.
 *
 * Slides authored in JSON name icons by string slug ("github", "vscode",
 * "code2"…). The runtime resolves each slug to a React component via this
 * map. Drop a JSON spec into any compliant renderer and as long as it has
 * the same registry, the visual reproduces.
 *
 * Brand-mark icons (vscode/github-mark/jetbrains/figma-mark) come from
 * `BrandIcons.tsx` and have an associated default brand color so an authored
 * JSON only needs to name them — no need to repeat the hex.
 *
 * Any icon NOT in this map is silently skipped (with a console.warn) so a
 * slide pulled from a newer pack still mostly renders on an older app.
 */
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Code2, Terminal, GitBranch, Github, Figma, Boxes, Container, Cpu,
  Cloud, Database, Braces, Bug,
  Book, Clipboard, FileText, MessageSquare, UserCheck, Users, Video,
  Compass, Target, Hammer, TrendingUp, Workflow, Layers, Activity, Sparkles,
} from 'lucide-react';
import { VSCodeIcon, GitHubMarkIcon, JetBrainsIcon, FigmaIcon } from './components/BrandIcons';

/** Slug → React component. Slugs are kebab/lower-case for JSON ergonomics. */
export const AMBIENT_ICON_REGISTRY: Record<string, ComponentType<LucideProps>> = {
  // Lucide dev-tool family
  code2:      Code2,
  terminal:   Terminal,
  'git-branch': GitBranch,
  github:     Github,            // lucide outline mark
  figma:      Figma,
  boxes:      Boxes,
  container:  Container,
  cpu:        Cpu,
  cloud:      Cloud,
  database:   Database,
  braces:     Braces,
  bug:        Bug,
  // Productivity family
  book:       Book,
  clipboard:  Clipboard,
  'file-text':FileText,
  'message-square': MessageSquare,
  'user-check':UserCheck,
  users:      Users,
  video:      Video,
  // Process / strategy family
  compass:    Compass,
  target:     Target,
  hammer:     Hammer,
  'trending-up': TrendingUp,
  workflow:   Workflow,
  layers:     Layers,
  activity:   Activity,
  sparkles:   Sparkles,
  // Brand silhouettes (authored marks). These have suggested brand colors —
  // see DEFAULT_BRAND_COLORS below.
  vscode:        VSCodeIcon,
  'github-mark': GitHubMarkIcon,
  jetbrains:     JetBrainsIcon,
  'figma-mark':  FigmaIcon,
};

/** Suggested brand color per slug. JSON can override or omit. */
export const AMBIENT_DEFAULT_BRAND_COLORS: Record<string, string> = {
  vscode:        '#007ACC',
  github:        '#FFFFFF',
  'github-mark': '#FFFFFF',
  jetbrains:     '#FF318C',
  figma:         '#F24E1E',
  'figma-mark':  '#F24E1E',
  cloud:         '#4FC3F7',
  database:      '#F0DB4F',
};

/**
 * Resolve an ordered list of icon slugs to React components. Unknown slugs
 * are dropped with a console warning so missing-icon doesn't blank the whole
 * ambient field.
 */
export function resolveIconSlugs(
  slugs: ReadonlyArray<string>,
): ComponentType<LucideProps>[] {
  const out: ComponentType<LucideProps>[] = [];
  for (const slug of slugs) {
    const Icon = AMBIENT_ICON_REGISTRY[slug];
    if (Icon) {
      out.push(Icon);
    } else if (typeof console !== 'undefined') {
      console.warn(`[ambient] Unknown icon slug "${slug}" — skipped.`);
    }
  }
  return out;
}
