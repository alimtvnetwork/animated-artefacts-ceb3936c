import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

/**
 * Tooltip — premium noir/gold polish to match the contact card surface.
 *
 * v0.44.0 design notes:
 *   - Larger min-height + comfortable padding (10px×14px) so single-line
 *     tooltips don't feel cramped against their trigger. Multi-line text
 *     gets `leading-snug` for tight-but-readable line height.
 *   - 12px font with `0.01em` tracking — same scale as the contact card
 *     micro-copy. Smaller than body text, large enough to read at glance.
 *   - Surface uses `popover` token + 92% alpha + backdrop blur so the
 *     tooltip sits above ambient backgrounds without occluding context.
 *     Border is gold-tinted at 28% so the chip ties to the brand without
 *     screaming.
 *   - Rounded-lg (8px) matches the contact card capsule radius.
 *   - Subtle shadow stack: a soft black drop + a hairline gold inner glow
 *     so the chip lifts off the slide stage but never glows like a button.
 *   - Larger sideOffset (8px) so the chip clears most trigger borders
 *     without colliding into hover-revealed icons.
 *   - Animation unchanged (fade + zoom + side-aware slide) — already
 *     matched the rest of the system.
 */
const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipPortal = TooltipPrimitive.Portal;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  // v0.230 — render in a Portal so the tooltip escapes ancestor
  // `overflow:hidden` clips (e.g. the controller-pill morph wrapper)
  // and ancestor transform/filter stacking contexts. Without the
  // portal, controller tooltips were clipped to the pill and never
  // appeared on screen.
  <TooltipPortal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-[60] max-w-xs overflow-hidden rounded-lg px-3.5 py-2 text-[12px] font-medium leading-snug tracking-[0.01em]",
        "border border-primary/35 bg-popover/[0.96] text-popover-foreground backdrop-blur-md",
        "shadow-[0_10px_28px_-12px_hsl(0_0%_0%/0.65),0_0_0_1px_hsl(var(--primary)/0.10)]",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </TooltipPortal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
