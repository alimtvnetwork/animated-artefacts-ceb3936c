// Ambient declaration for lucide-react per-icon deep imports.
// lucide-react ships JS without per-icon .d.ts entries; every icon file
// exports a default `LucideIcon` component. The per-icon Vite plugin
// (`vite-plugins/lucide-per-icon.ts`) and `src/slides/components/lucideDynamic.ts`
// rely on these deep imports to keep the bundle tree-shakeable.
declare module 'lucide-react/dist/esm/icons/*.js' {
  import type { LucideIcon } from 'lucide-react';
  const icon: LucideIcon;
  export default icon;
}
