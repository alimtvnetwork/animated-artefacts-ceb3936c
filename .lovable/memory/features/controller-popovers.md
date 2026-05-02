# Memory: Controller popovers (v0.87)

The Theme / Share / Deck-manifest popovers in `ControllerBar.tsx` MUST be
mounted OUTSIDE the `controller-pill` `motion.div`. That pill is
`overflow-hidden` for the morph animation between collapsed and
expanded states; mounting popovers inside the pill clips them and they
render invisibly (the user-reported "menu opens but clicking does
nothing" bug — actually the menu wasn't visible at all).

Pattern: trigger buttons live inside the pill (so they morph with it).
Popovers mount as a sibling of the pill, positioned `absolute bottom-full
mb-3 right-0` against the outer hover wrapper. The hover wrapper's
`onMouseEnter`/`onMouseLeave` already covers both regions so the
controller stays expanded while the popover is open.

If you add a NEW popover-style menu to the controller, follow the same
pattern. Do NOT wrap menus inside `motion.div.controller-pill`.
