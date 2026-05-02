# Subsystem: controller

## Spec Statement
Hidden by default, hover-reveals. Match `src/assets/controller-reference/controller-pill.png` exactly. Pill order: prev / "N/total" / next / share / fullscreen. Default position BottomCenter. Slide indicator: click number → input → Enter jumps. Position alt: TopRight.

## Implementation State
Controller controls live in `src/slides/controls/`. Reference image present. Two positions in `ControllerPosition` enum. Hover-reveal via CSS opacity tokens.

## Gap
None observed.

## Severity
None.

## Evidence
- spec: `spec/21-slides-system/02-controller.md`, `14-controller-collapsed-v2.md`
- impl: `src/slides/controls/`
- test: visual reference (`src/assets/controller-reference/`)

## Remediation
None.
