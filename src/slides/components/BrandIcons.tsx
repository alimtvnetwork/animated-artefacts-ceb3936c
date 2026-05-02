/**
 * BrandIcons — small set of recognizable real-brand SVGs used as
 * accent icons in the home `AmbientBackground` (spec 31 §3).
 *
 * Lucide does not ship dev-tool brand marks (JetBrains, VS Code), so
 * we inline tight monochrome paths and let the consumer color them
 * via the standard Lucide `color`/`style` props the AmbientBackground
 * already passes through.
 *
 * Each icon mimics the Lucide API: `(props: LucideProps) => JSX.Element`.
 * `strokeWidth` is honored where the mark has stroked geometry; the
 * VS Code and JetBrains marks are filled silhouettes by design.
 */
import type { LucideProps } from 'lucide-react';

/** VS Code — simplified two-shape silhouette in canonical brand blue. */
export function VSCodeIcon(props: LucideProps) {
  const { size = 24, color = 'currentColor', style, className } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path
        fill={color}
        d="M17.86 1.5a1.5 1.5 0 0 1 .85.27l3.7 2.66a1.5 1.5 0 0 1 .59 1.21v12.72a1.5 1.5 0 0 1-.59 1.21l-3.7 2.66a1.5 1.5 0 0 1-1.78-.05L4.4 11.99a.5.5 0 0 1 0-.78L16.93 1.81a1.5 1.5 0 0 1 .93-.31m-.5 5.78L8.1 12l9.26 4.72V7.28"
      />
    </svg>
  );
}

/** JetBrains — angled monogram. Brand colors are a 3-stop gradient
 *  (magenta → orange → yellow); we use a simplified two-color blend so
 *  the mark still reads at small sizes without shipping a gradient def. */
export function JetBrainsIcon(props: LucideProps) {
  const { size = 24, color, style, className } = props;
  // When the consumer doesn't override color we fall back to the
  // canonical JetBrains magenta so the icon stays on-brand.
  const fill = color ?? '#FF318C';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path fill={fill} d="M2 2h20v20H2z" opacity="0.0" />
      <path
        fill={fill}
        d="M3 3h6v1.5H6.4v6.7H4.5V4.5H3V3m9.4 1.6c1.6 0 2.4.8 2.4 2.1 0 1-.5 1.6-1.3 1.9.9.2 1.5.9 1.5 2 0 1.5-1 2.4-2.7 2.4H8.5V4.6h3.9m-2.1 3.1h1.7c.7 0 1-.3 1-.8s-.3-.8-1-.8h-1.7v1.6m0 3.4h1.9c.7 0 1.1-.3 1.1-.9s-.4-.9-1.1-.9h-1.9v1.8M3 19.5v1.4h7.5v-1.4H3"
      />
    </svg>
  );
}

/** GitHub-Octocat-style mark. Lucide already ships a `Github` icon, but
 *  the lucide one renders as a thin stroke that disappears at small ambient
 *  sizes — this is a filled silhouette that holds up at 26–50px. */
export function GitHubMarkIcon(props: LucideProps) {
  const { size = 24, color = 'currentColor', style, className } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path
        fill={color}
        d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.7 1.2 3.4.9.1-.7.4-1.2.7-1.5-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3 0 0 1-.3 3.2 1.2.9-.3 1.9-.4 2.9-.4s2 .1 2.9.4c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.7.1 3 .8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.3.8 1 .8 2v3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5"
      />
    </svg>
  );
}

/** Figma — five-color disc/square logo. We render all five shapes in their
 *  canonical brand colors regardless of the consumer's `color` prop, because
 *  the multi-color identity IS the icon. The shapes form a stylized "F" using
 *  three rounded squares + a circle per Figma's brand guide. */
export function FigmaIcon(props: LucideProps) {
  const { size = 24, style, className } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
      aria-hidden="true"
    >
      {/* Top-left red half-pill */}
      <path fill="#F24E1E" d="M8 1.5h4v7H8a3.5 3.5 0 0 1 0-7Z" />
      {/* Bottom-left green half-pill */}
      <path fill="#0ACF83" d="M8 15.5h4v3.5a3.5 3.5 0 1 1-4-3.5h0Z" />
      {/* Middle-left orange half-pill */}
      <path fill="#FF7262" d="M8 8.5h4v7H8a3.5 3.5 0 1 1 0-7Z" />
      {/* Top-right purple half-pill */}
      <path fill="#A259FF" d="M12 1.5h4a3.5 3.5 0 1 1 0 7h-4v-7Z" />
      {/* Middle-right blue circle */}
      <circle fill="#1ABCFE" cx="15.5" cy="12" r="3.5" />
    </svg>
  );
}
