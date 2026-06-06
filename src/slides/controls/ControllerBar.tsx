import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Share2, Maximize2, Minimize2, LayoutGrid, MonitorPlay, FileJson, Palette, Eye, EyeOff, PanelTop, PanelTopClose, Contrast, Wind, Menu, Keyboard, ListChecks, Sparkles, PlayCircle, Bug } from 'lucide-react';
import { toast } from 'sonner';
import { useClickRevealStepwise, toggleClickRevealStepwise } from '../components/clickRevealStepwise';
import {
  TRANSITION_TYPE_NAMES,
  type TransitionTypeName,
  getTransitionOverrideState,
  setTransitionOverrideState,
  subscribeTransitionOverride,
} from '../transitionOverride';
import {
  getStepMotionOverrideState,
  setStepMotionOverrideState,
  subscribeStepMotionOverride,
} from '../stepMotionOverride';
import type { StepMotionVariant } from '../utils/stepMotionVariant';
import { useColorDebug, toggleColorDebug } from '../components/ColorTokenDebugOverlay';
import { useReduceMotion, toggleReduceMotion } from '../components/reducedMotionToggle';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ShareMenu } from './ShareMenu';
import { PresenterWebcamButton } from './PresenterWebcamButton';
import { SlideIndicator } from './SlideIndicator';
import { DeckMenu } from './DeckMenu';
import { ThemeMenu } from './ThemeMenu';
import { ImportExportSubmenu } from './ImportExportSubmenu';
import { writeThemeDebugFlag } from '../manifest';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { OnboardingCoachmark } from './OnboardingCoachmark';
import { useOnboardingFlag } from './useOnboardingFlag';
// v5 (2026-05-02): the Radix DropdownMenu was replaced with a hover-driven
// custom panel inside `ControllerHamburger` because the dropdown's focus
// trap was collapsing the controller pill on click. The previous imports
// (DropdownMenu, DropdownMenuContent, DropdownMenuSub, …) are intentionally
// removed; if any future submenu needs a real Radix dropdown, re-add them.
// v0.48 — replaced every native `title=` attr in this controller with the
// styled Tooltip primitive so the chips match the rest of the deck (gold
// border, popover surface, polished spacing). The TooltipProvider is
// mounted at the App root (src/App.tsx), so we only need the Tooltip /
// Trigger / Content trio here.
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  current: number;
  total: number;
  /** Reserved for future "auto-peek on activity" behavior. Currently unused — the
   *  controller only expands on direct hover (per design rule). */
  visible?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onJump: (n: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onToggleGrid: () => void;
  /**
   * "Reveal hints" is a presenter aid: when on, click-reveal capsules pulse
   * with a gold ring so they're clearly distinguishable from non-interactive
   * sibling capsules. The button is hidden when the active slide has no
   * click-reveal entrypoints (passed as `undefined`).
   */
  revealHints?: boolean;
  onToggleRevealHints?: () => void;
  /**
   * "Hide top jumper" — presenter affordance to keep the live stage clean
   * during fullscreen presentation. When on, the always-visible "NN / NN"
   * chip pinned to the top-center of the viewport is hidden. Persisted in
   * localStorage by the parent so the choice survives reloads. Bound to
   * the `J` keyboard shortcut.
   */
  topJumperHidden?: boolean;
  onToggleTopJumper?: () => void;
}

/**
 * Bottom-right controller. Two states:
 * - **Collapsed (default):** a single small "next" arrow button at ~55% opacity.
 * - **Expanded:** the full pill with prev / N·total / next / grid / presenter /
 *   manifest / share / theme / fullscreen.
 *
 * ## Behavior
 * - Expansion is **hover-only**. Mouse activity elsewhere on the slide does NOT
 *   peek the pill — it only opens when the cursor is over the controller's
 *   hover region (or a child menu like Share/Theme/Manifest is open).
 * - Both states render inside one stable wrapper sized to the largest possible
 *   pill, so moving from the small arrow into the expanded pill is one
 *   continuous hover (no gap → no flicker).
 * - The shape morphs smoothly via framer's `layout` animation: the same
 *   `controller-pill` element grows from 48×48 to its full pill size with a
 *   single eased width/border-radius animation. Children fade in on top.
 */
export function ControllerBar({ current, total, onPrev, onNext, onJump, isFullscreen, onToggleFullscreen, onToggleGrid, revealHints, onToggleRevealHints, topJumperHidden, onToggleTopJumper }: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const [deckMenuOpen, setDeckMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [deckToolsOpen, setDeckToolsOpen] = useState(false);
  const [themeToolsOpen, setThemeToolsOpen] = useState(false);
  // C07 — first-run onboarding coachmark. Shows once (gated in localStorage);
  // re-openable from the presenter menu via "Show intro again".
  const { onboarded, markOnboarded, resetOnboarding } = useOnboardingFlag();
  const [introOpen, setIntroOpen] = useState(false);
  useEffect(() => {
    if (!onboarded) setIntroOpen(true);
  }, [onboarded]);
  const [hovered, setHovered] = useState(false);
  // `pinned` is the user-toggled "Extend" state — when true the full
  // controller stays open even after the mouse leaves. Hover or open menus
  // still expand transiently as before.
  const [pinned, setPinned] = useState(false);
  const expanded = pinned || hovered || shareOpen || deckMenuOpen || themeMenuOpen || hamburgerOpen || deckToolsOpen || themeToolsOpen;

  // ?themeDebug=1 — demo helper. Persists the debug flag in localStorage
  // (so the panel stays open across navigation) and auto-opens the theme
  // menu on first mount. ?themeDebug=0 clears the flag without auto-open.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('themeDebug')) return;
    const value = params.get('themeDebug');
    try {
      if (value === '1' || value === 'true') {
        writeThemeDebugFlag(true);
        setThemeMenuOpen(true);
        setShareOpen(false);
        setDeckMenuOpen(false);
      } else if (value === '0' || value === 'false') {
        writeThemeDebugFlag(false);
      }
    } catch {
      /* localStorage may be blocked in privacy mode — still open the menu */
      if (value === '1' || value === 'true') setThemeMenuOpen(true);
    }
    // Intentionally only runs once on mount.
  }, []);

  const morphTransition = { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };

  return (
    // Stable hover wrapper — sized just large enough to bridge the gap between
    // the collapsed arrow and the expanded pill so the cursor never leaves the
    // hover region while the shape grows. `data-print-hide` keeps the
    // controller out of print/PDF/HTML exports so only the slide chrome prints.
    <div
      data-print-hide="true"
      className="fixed top-6 right-6 z-50 flex items-start justify-end pl-4 pb-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <LayoutGroup id="controller">
        <motion.div
          layout
          transition={morphTransition}
          className="controller-pill flex items-center text-[hsl(var(--chrome-fg))] overflow-hidden"
          style={{
            // Animate height + border-radius via layout; padding shifts subtly.
            borderRadius: 9999,
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {expanded ? (
              <motion.div
                key="expanded"
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex items-center gap-1 px-2 py-2"
              >
                <button onClick={onPrev} aria-label="Previous" className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gold/15 transition lift-hover-subtle">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <SlideIndicator
                  current={current}
                  total={total}
                  onJump={onJump}
                  onDoubleTap={onToggleRevealHints}
                  doubleTapActive={revealHints}
                />
                <button onClick={onNext} aria-label="Next" className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gold/15 transition lift-hover-subtle">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="h-5 w-px bg-[hsl(var(--chrome-border))] mx-1" />
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => { setDeckMenuOpen(v => !v); setShareOpen(false); setThemeMenuOpen(false); }} aria-label="Deck manifest (export / import)" className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gold/15 transition lift-hover-subtle">
                        <FileJson className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Deck manifest</TooltipContent>
                  </Tooltip>
                  {/* v0.87 — popovers moved out of the overflow-hidden pill (see below). */}
                </div>
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => { setShareOpen(v => !v); setDeckMenuOpen(false); setThemeMenuOpen(false); }} aria-label="Share" className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gold/15 transition lift-hover-subtle">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Share</TooltipContent>
                  </Tooltip>
                </div>
                {/* v1.2 — presenter webcam toggle (squiggling chip when off). */}
                <div className="relative ml-1"><PresenterWebcamButton /></div>
                <span className="h-5 w-px bg-[hsl(var(--chrome-border))] mx-1" />
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => { setThemeMenuOpen(v => !v); setShareOpen(false); setDeckMenuOpen(false); }} aria-label="Theme palette" className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gold/15 transition lift-hover-subtle">
                        <Palette className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Theme palette</TooltipContent>
                  </Tooltip>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={onToggleFullscreen} aria-label="Fullscreen (press F)" className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gold/15 transition lift-hover-subtle">
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                  </TooltipTrigger>
                  {/* v0.107 — surface the keyboard shortcut so presenters discover it on hover. */}
                  <TooltipContent side="bottom" align="center" sideOffset={8}>
                    <span className="inline-flex items-center gap-2">
                      {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                      <kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--chrome-hover))] text-[10px] font-mono tracking-wide text-[hsl(var(--chrome-fg-muted))] border border-[hsl(var(--chrome-border))]">F</kbd>
                    </span>
                  </TooltipContent>
                </Tooltip>
                {/* Hamburger menu — last item after Fullscreen, before the
                    Extend pin. Hover-driven (no click required) so the
                    presenter sees Overview / Presenter view / Top jumper /
                    Reveal hints / Transition style / Contrast / Reduce
                    motion / Keyboard map without dismissing the controller.
                    See `mem://features/controller-hamburger`. */}
                <ControllerHamburger
                  open={hamburgerOpen}
                  onOpenChange={setHamburgerOpen}
                  onToggleGrid={onToggleGrid}
                  onToggleRevealHints={onToggleRevealHints}
                  revealHints={revealHints}
                  onToggleTopJumper={onToggleTopJumper}
                  topJumperHidden={topJumperHidden}
                  onOpenKeyboardMap={() => setKeyboardOpen(true)}
                  onShowIntro={() => { resetOnboarding(); setIntroOpen(true); }}
                  currentSlideNumber={current}
                />
                {/* Extend / collapse pin — locks the controller open so the
                    presenter doesn't need to keep hovering. Tooltip + aria
                    flip with state so screen readers and the chip preview
                    both reflect what the next click will do. */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setPinned(p => !p)}
                      aria-label={pinned ? 'Collapse controller' : 'Extend controller'}
                      aria-pressed={pinned}
                      className={`h-9 w-9 flex items-center justify-center rounded-full transition lift-hover-subtle ${
                        pinned ? 'bg-gold/20 text-gold ring-1 ring-gold/60' : 'hover:bg-gold/15'
                      }`}
                    >
                      {pinned ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {pinned ? 'Collapse to Next/Prev' : 'Extend — keep controls open'}
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ) : (
              // Collapsed shape v2 — two-button pill (← prev · → next).
              // See `spec/slides/14-controller-collapsed-v2.md`. Both buttons
              // morph into their expanded-state slots via the parent
              // LayoutGroup, so the transition is one continuous slide rather
              // than fade-out + fade-in.
              <motion.div
                key="collapsed"
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex items-center gap-0.5 px-1.5 py-1"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => { e.stopPropagation(); onPrev(); }}
                      aria-label={`Previous slide (${current} of ${total})`}
                      className="h-10 w-10 flex items-center justify-center rounded-full text-[hsl(var(--chrome-fg-muted))] hover:bg-gold/15 hover:text-gold transition lift-hover-subtle"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Previous slide</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => { e.stopPropagation(); onNext(); }}
                      aria-label={`Next slide (${current + 1} of ${total})`}
                      className="h-10 w-10 flex items-center justify-center rounded-full text-gold hover:bg-gold/20 transition lift-hover-subtle"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Next slide — hover for full controls</TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
      {/* v0.87 — popovers (Theme / Share / Deck) live OUTSIDE the
          `controller-pill` (which is `overflow-hidden` for the morph
          animation). Mounting them here keeps them inside the hover
          region (so the controller stays expanded while the menu is
          open) but renders them above the clipping box so they're
          visible. The right-side anchor (`right-6`) matches the pill's
          fixed position so the menu hugs the same edge. Bug fix for the
          "menu opens but nothing happens" symptom on slide 3. */}
      {(themeMenuOpen || shareOpen || deckMenuOpen || deckToolsOpen || themeToolsOpen) && (
        <div className="absolute top-full mt-3 right-0">
          {themeMenuOpen && <ThemeMenu onClose={() => setThemeMenuOpen(false)} />}
          {shareOpen && <ShareMenu currentSlide={current} onClose={() => setShareOpen(false)} />}
          {deckMenuOpen && <DeckMenu onClose={() => setDeckMenuOpen(false)} />}
          {deckToolsOpen && <DeckMenu onClose={() => setDeckToolsOpen(false)} />}
          {themeToolsOpen && <ThemeMenu onClose={() => setThemeToolsOpen(false)} />}
        </div>
      )}
      {/* Keyboard shortcuts dialog — opened by the hamburger item or by `/`
          (the dialog component owns the global key listener). Mounted here
          so it's always available regardless of controller expansion state. */}
      <KeyboardShortcutsDialog open={keyboardOpen} onOpenChange={setKeyboardOpen} />
      <OnboardingCoachmark open={introOpen} onDismiss={() => { setIntroOpen(false); markOnboarded(); }} />
    </div>
  );
}

/**
 * `ControllerHamburger` — Menu-icon button + Radix DropdownMenu that
 * consolidates presenter-cleanup affordances previously scattered as
 * standalone chrome chips. See `mem://features/controller-hamburger`.
 *
 * Items: Overview, Presenter view, Top Talk Jumper, Reveal hints,
 * Contrast debug, Reduce motion, Keyboard map.
 *
 * Reveal hints is hidden when the active slide has no click-reveal
 * entrypoints (parent passes `onToggleRevealHints={undefined}`); the
 * dropdown still renders without that row.
 *
 * Top jumper toggle is hidden the same way when the parent omits the
 * handler.
 */
interface HamburgerProps {
  /** Lifted state — parent uses this to keep the controller pill expanded
   *  while the hover panel is open (`hamburgerOpen` feeds `expanded`). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleGrid: () => void;
  onToggleRevealHints?: () => void;
  revealHints?: boolean;
  onToggleTopJumper?: () => void;
  topJumperHidden?: boolean;
  onOpenKeyboardMap: () => void;
  /** Clears the onboarding flag and re-opens the first-run coachmark. */
  onShowIntro: () => void;
  /** Active slide number — used as the default scope target for the live
   *  Transition style picker (per-slide override). */
  currentSlideNumber: number;
}

/**
 * `ControllerHamburger` — hover-revealed presenter menu in the controller
 * pill (last item, after Fullscreen). Hovering the Menu button slides up
 * a panel with Overview / Presenter view / Top jumper / Reveal hints /
 * Transition style / Contrast / Reduce motion / Keyboard map. No click
 * required and no Radix DropdownMenu (whose focus-trap was collapsing the
 * controller pill on click — see issue 2026-05-02).
 *
 * Open/close is delay-buffered (80ms in, 220ms out) so the cursor can
 * travel from the button to the panel without losing hover.
 */
function ControllerHamburger({
  open,
  onOpenChange,
  onToggleGrid,
  onToggleRevealHints,
  revealHints,
  onToggleTopJumper,
  topJumperHidden,
  onOpenKeyboardMap,
  onShowIntro,
  currentSlideNumber,
}: HamburgerProps) {
  // Contrast/Reduce-motion state now lives inside `DebugSubmenu`.
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  // Anchor coordinates for the portaled panel. Recomputed every time the
  // panel opens (and on viewport resize while open) because the controller
  // pill morphs in size as it expands. Without portaling, the panel was
  // clipped by the pill's `overflow-hidden` and effectively invisible —
  // which is exactly the "hover does nothing" bug the user reported.
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const recomputeAnchor = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchor({
      top: r.bottom + 8, // 8px gap below trigger (controller is top-anchored)
      right: window.innerWidth - r.right,
    });
  };

  const cancelTimers = () => {
    if (openTimerRef.current) { clearTimeout(openTimerRef.current); openTimerRef.current = null; }
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
  };
  const scheduleOpen = () => {
    cancelTimers();
    openTimerRef.current = setTimeout(() => onOpenChange(true), 80);
  };
  const scheduleClose = () => {
    cancelTimers();
    closeTimerRef.current = setTimeout(() => onOpenChange(false), 220);
  };
  useEffect(() => () => cancelTimers(), []);

  // Recompute anchor whenever the panel opens, and follow viewport resizes
  // while it's open so the panel stays glued to the trigger.
  useLayoutEffect(() => {
    if (!open) return;
    recomputeAnchor();
    const onResize = () => recomputeAnchor();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open]);

  // Click on the trigger toggles too — keyboard / touch fallback for users
  // who don't hover (and avoids the previous "click hides everything" bug).
  const handleTriggerClick = () => {
    cancelTimers();
    onOpenChange(!open);
  };

  // Reusable item shells — match the previous Radix dropdown styling.
  const itemBase =
    'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-left ' +
    'hover:bg-[hsl(var(--chrome-hover))] focus:bg-[hsl(var(--chrome-hover))] ' +
    'focus:outline-none transition-colors cursor-pointer';
  const labelClass =
    'px-2 pt-2 pb-1 text-[hsl(var(--chrome-fg-muted))] uppercase text-[10px] tracking-widest';
  const sepClass = 'my-1 h-px bg-[hsl(var(--chrome-border))]';

  return (
    <div
      className="relative"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label="Presenter menu"
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={handleTriggerClick}
            onFocus={scheduleOpen}
            className={`h-9 w-9 flex items-center justify-center rounded-full transition lift-hover-subtle ${
              open ? 'bg-gold/20 text-gold' : 'hover:bg-gold/15'
            }`}
          >
            <Menu className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        {!open && <TooltipContent side="bottom">Presenter menu</TooltipContent>}
      </Tooltip>

      {createPortal(
        <AnimatePresence>
          {open && anchor && (
            <motion.div
              key="hamburger-panel"
              role="menu"
              aria-label="Presenter menu"
              // Panel opens downward (anchored at trigger's bottom edge), so
              // it starts slightly ABOVE its resting spot and settles down.
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              // Portaled to <body> so the controller pill's `overflow-hidden`
              // can't clip us. Position is `fixed` and computed from the
              // trigger's bounding rect (see `recomputeAnchor`).
              style={{ top: anchor.top, right: anchor.right }}
              className="fixed z-[60] min-w-[16rem] rounded-xl border border-[hsl(var(--chrome-border))] bg-[hsl(var(--chrome-bg))] p-1.5 text-[hsl(var(--chrome-fg))] shadow-2xl backdrop-blur-md"
              onMouseEnter={cancelTimers}
              onMouseLeave={scheduleClose}
            >
            <div className={labelClass}>Presenter</div>
            <button type="button" onClick={onToggleGrid} className={itemBase}>
              <LayoutGrid className="h-4 w-4" />
              <span className="flex-1">Overview</span>
              <kbd className="text-[10px] font-mono opacity-60">G</kbd>
            </button>
            <button
              type="button"
              onClick={() => window.open('/present', 'presenter', 'noopener,width=1280,height=800')}
              className={itemBase}
            >
              <MonitorPlay className="h-4 w-4" />
              <span className="flex-1">Presenter view</span>
            </button>
            {onToggleTopJumper && (
              <button type="button" onClick={onToggleTopJumper} className={itemBase}>
                {topJumperHidden ? <PanelTopClose className="h-4 w-4 text-gold" /> : <PanelTop className="h-4 w-4" />}
                <span className="flex-1">{topJumperHidden ? 'Show top jumper' : 'Hide top jumper'}</span>
                <kbd className="text-[10px] font-mono opacity-60">J</kbd>
              </button>
            )}
            {onToggleRevealHints && (
              <button type="button" onClick={onToggleRevealHints} className={itemBase}>
                {revealHints ? <Eye className="h-4 w-4 text-gold" /> : <EyeOff className="h-4 w-4" />}
                <span className="flex-1">{revealHints ? 'Hide reveal hints' : 'Show reveal hints'}</span>
              </button>
            )}
            {onToggleRevealHints && (
              <ClickRevealModeItem
                onToggleRevealHints={onToggleRevealHints}
                revealHints={revealHints}
                itemClass={itemBase}
              />
            )}
            <TransitionStyleSubmenu currentSlideNumber={currentSlideNumber} itemClass={itemBase} labelClass={labelClass} sepClass={sepClass} />
            <StepMotionSubmenu itemClass={itemBase} labelClass={labelClass} />
            <div className={sepClass} />
            <div className={labelClass}>Import / Export</div>
            <button
              type="button"
              onClick={() => {
                try {
                  const filename = downloadLlmGuide();
                  toast.success('LLM guide downloaded', { description: filename });
                } catch (err) {
                  toast.error('Could not generate LLM guide', {
                    description: err instanceof Error ? err.message : String(err),
                  });
                }
              }}
              className={itemBase}
            >
              <Download className="h-4 w-4" />
              <span className="flex-1">Download LLM guide (.md)</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await copyLlmGuideToClipboard();
                if (ok) toast.success('LLM guide copied to clipboard');
                else toast.error('Clipboard copy blocked — try Download instead');
              }}
              className={itemBase}
            >
              <ClipboardCopy className="h-4 w-4" />
              <span className="flex-1">Copy LLM guide</span>
            </button>
            <div className={sepClass} />
            <DebugSubmenu itemClass={itemBase} labelClass={labelClass} />

            <div className={sepClass} />
            <button type="button" onClick={onOpenKeyboardMap} className={itemBase}>
              <Keyboard className="h-4 w-4" />
              <span className="flex-1">Keyboard map</span>
              <kbd className="text-[10px] font-mono opacity-60">/</kbd>
            </button>
            <button type="button" onClick={onShowIntro} className={itemBase}>
              <PlayCircle className="h-4 w-4" />
              <span className="flex-1">Show intro again</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

// `ContrastDebugToggleButton` and `ReduceMotionToggleButton` were
// removed in v5 (2026-05-02) when their affordances moved into the
// hamburger dropdown above. State hooks (`useColorDebug` /
// `useReduceMotion`) and the toggle helpers are now consumed directly
// inside `ControllerHamburger`.

/**
 * `ClickRevealModeItem` — combined dropdown row that toggles BOTH
 * `revealHints` (gold-ring pulse) and `clickRevealStepwise` (deck-level
 * flag for stepwise reveal sequencing) in lockstep, so click-reveal
 * capsules behave consistently per slide.
 *
 * The flag is persisted under `riseup.clickRevealStepwise` and exposed
 * via `useClickRevealStepwise()`. Slide-type consumption is a follow-up
 * (see `.lovable/question-and-ambiguity/32-…`).
 */
function ClickRevealModeItem({
  onToggleRevealHints,
  revealHints,
  itemClass,
}: {
  onToggleRevealHints: () => void;
  revealHints?: boolean;
  itemClass: string;
}) {
  const stepwise = useClickRevealStepwise();
  const combined = Boolean(revealHints) && stepwise;
  const handle = () => {
    const next = !combined;
    if (Boolean(revealHints) !== next) onToggleRevealHints();
    if (stepwise !== next) toggleClickRevealStepwise();
  };
  return (
    <button type="button" onClick={handle} className={itemClass}>
      <ListChecks className={`h-4 w-4 ${combined ? 'text-gold' : ''}`} />
      <span className="flex-1">
        {combined ? 'Disable click-reveal mode' : 'Enable click-reveal mode'}
      </span>
    </button>
  );
}

/**
 * `TransitionStyleSubmenu` — inline expandable section inside the hover
 * panel. Lets the presenter swap the slide-to-slide animation live
 * (Fade / Slide / Push / PushLeft / PushRight) without opening the full
 * Transition Inspector. Backed by the `transitionOverride` store.
 *
 * Default scope is **This slide**. The "Apply to whole deck" toggle flips
 * scope to deck-wide. "Authored" clears the type override.
 */
const TRANSITION_STYLE_LABELS: Record<TransitionTypeName, string> = {
  FadeIn: 'Fade in',
  SlideIn: 'Slide in',
  PushIn: 'Push in',
  PushLeft: 'Push left',
  PushRight: 'Push right',
};

function TransitionStyleSubmenu({
  currentSlideNumber,
  itemClass,
  labelClass,
  sepClass,
}: {
  currentSlideNumber: number;
  itemClass: string;
  labelClass: string;
  sepClass: string;
}) {
  const [state, setState] = useState(() => getTransitionOverrideState());
  const [expanded, setExpanded] = useState(false);
  useEffect(
    () => subscribeTransitionOverride(() => setState(getTransitionOverrideState())),
    [],
  );

  const deckScope = state.scope === 'deck';
  const activeForCurrent =
    state.transitionType !== null
    && (deckScope || state.scopeSlideNumber === currentSlideNumber);
  const currentValue = activeForCurrent ? state.transitionType : null;

  const pickStyle = (value: TransitionTypeName | null) => {
    if (value === null) {
      setTransitionOverrideState({ transitionType: null });
      return;
    }
    if (deckScope) {
      setTransitionOverrideState({ transitionType: value });
    } else {
      setTransitionOverrideState({
        transitionType: value,
        scope: 'slide',
        scopeSlideNumber: currentSlideNumber,
      });
    }
  };

  const toggleDeckWide = () => {
    if (deckScope) {
      setTransitionOverrideState({ scope: 'slide', scopeSlideNumber: currentSlideNumber });
    } else {
      setTransitionOverrideState({ scope: 'deck', scopeSlideNumber: null });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={itemClass}
      >
        <Sparkles className={`h-4 w-4 ${activeForCurrent ? 'text-gold' : ''}`} />
        <span className="flex-1">Transition style</span>
        {activeForCurrent && currentValue && (
          <span className="text-[10px] text-gold/80">
            {TRANSITION_STYLE_LABELS[currentValue]}
          </span>
        )}
        <ChevronRight
          className={`h-3.5 w-3.5 opacity-60 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="ml-2 border-l border-[hsl(var(--chrome-border))] pl-2">
          <div className={labelClass}>
            {deckScope ? 'Whole deck' : `Slide ${currentSlideNumber}`}
          </div>
          <button
            type="button"
            onClick={() => pickStyle(null)}
            className={itemClass}
          >
            <span className={`inline-block h-3 w-3 rounded-full border ${currentValue === null ? 'bg-gold border-gold' : 'border-[hsl(var(--chrome-border))]'}`} />
            <span className="flex-1">Authored (slide JSON)</span>
          </button>
          {TRANSITION_TYPE_NAMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => pickStyle(t)}
              className={itemClass}
            >
              <span className={`inline-block h-3 w-3 rounded-full border ${currentValue === t ? 'bg-gold border-gold' : 'border-[hsl(var(--chrome-border))]'}`} />
              <span className="flex-1">{TRANSITION_STYLE_LABELS[t]}</span>
            </button>
          ))}
          <div className={sepClass} />
          <button
            type="button"
            onClick={toggleDeckWide}
            aria-pressed={deckScope}
            className={itemClass}
          >
            <span className={`inline-block h-3 w-3 rounded-sm border ${deckScope ? 'bg-gold border-gold' : 'border-[hsl(var(--chrome-border))]'}`} />
            <span className="flex-1">Apply to whole deck</span>
          </button>
        </div>
      )}
    </>
  );
}

/**
 * `DebugSubmenu` — collapses the contrast-debug + reduce-motion toggles
 * behind a single expandable "Debug" entry (plan step 3: Debug = one
 * entry). Owns its own state hooks so the parent `ControllerHamburger`
 * stays lean. Matches the `TransitionStyleSubmenu` expandable pattern.
 */
function DebugSubmenu({
  itemClass,
  labelClass,
}: {
  itemClass: string;
  labelClass: string;
}) {
  const colorDebugOn = useColorDebug();
  const reduceMotionOn = useReduceMotion();
  const [expanded, setExpanded] = useState(false);
  const anyActive = colorDebugOn || reduceMotionOn;

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={itemClass}
      >
        <Bug className={`h-4 w-4 ${anyActive ? 'text-gold' : ''}`} />
        <span className="flex-1">Debug</span>
        <ChevronRight
          className={`h-3.5 w-3.5 opacity-60 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="ml-2 border-l border-[hsl(var(--chrome-border))] pl-2">
          <div className={labelClass}>Debug tools</div>
          <button type="button" onClick={() => toggleColorDebug()} className={itemClass}>
            <Contrast className={`h-4 w-4 ${colorDebugOn ? 'text-gold' : ''}`} />
            <span className="flex-1">{colorDebugOn ? 'Hide contrast debug' : 'Contrast debug'}</span>
          </button>
          <button type="button" onClick={() => toggleReduceMotion()} className={itemClass}>
            <Wind className={`h-4 w-4 ${reduceMotionOn ? 'text-gold' : ''}`} />
            <span className="flex-1">{reduceMotionOn ? 'Restore full motion' : 'Reduce motion'}</span>
          </button>
        </div>
      )}
    </>
  );
}

/**
 * `StepMotionSubmenu` — inline expandable section that locks every step
 * across step-driven slides (StepTimelineSlide, StepsChain3DSlide,
 * FocusTimelineSlide) to a single entrance variant. Pairs naturally with
 * the "Transition style" picker above so the presenter can compose a full
 * timeline mode (e.g. SlideIn slide-to-slide + slide step entrance with
 * fading labels).
 *
 * "Default rotation" clears the override → step entrances cycle through
 * lift → slide → parallax. Each option locks every step to that variant.
 *
 * Backed by `stepMotionOverride.ts`. The CSS that animates step entrances
 * lives in `index.css` under `.step-row[data-motion-variant="…"]`. Step
 * label fade is governed by the existing `.step-title` token chain so it
 * runs alongside the locked variant automatically.
 */
const STEP_MOTION_LABELS: Record<StepMotionVariant, string> = {
  lift: 'Lift (calm rise)',
  slide: 'Slide in',
  parallax: 'Parallax (3D depth)',
};

function StepMotionSubmenu({
  itemClass,
  labelClass,
}: {
  itemClass: string;
  labelClass: string;
}) {
  const [state, setState] = useState(() => getStepMotionOverrideState());
  const [expanded, setExpanded] = useState(false);
  useEffect(
    () => subscribeStepMotionOverride(() => setState(getStepMotionOverrideState())),
    [],
  );

  const current = state.variant;
  const pick = (v: StepMotionVariant | null) => setStepMotionOverrideState({ variant: v });

  const variants: StepMotionVariant[] = ['lift', 'slide', 'parallax'];

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={itemClass}
      >
        <ListChecks className={`h-4 w-4 ${current ? 'text-gold' : ''}`} />
        <span className="flex-1">Step motion</span>
        {current && (
          <span className="text-[10px] text-gold/80">
            {STEP_MOTION_LABELS[current]}
          </span>
        )}
        <ChevronRight
          className={`h-3.5 w-3.5 opacity-60 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="ml-2 border-l border-[hsl(var(--chrome-border))] pl-2">
          <div className={labelClass}>Every step uses…</div>
          <button
            type="button"
            onClick={() => pick(null)}
            className={itemClass}
          >
            <span className={`inline-block h-3 w-3 rounded-full border ${current === null ? 'bg-gold border-gold' : 'border-[hsl(var(--chrome-border))]'}`} />
            <span className="flex-1">Default rotation</span>
          </button>
          {variants.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => pick(v)}
              className={itemClass}
            >
              <span className={`inline-block h-3 w-3 rounded-full border ${current === v ? 'bg-gold border-gold' : 'border-[hsl(var(--chrome-border))]'}`} />
              <span className="flex-1">{STEP_MOTION_LABELS[v]}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
