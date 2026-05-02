# Subsystem: audio-and-narration

## Spec Statement
Per-slide sound triggers. Whoosh on slide change variants. Reduced-motion users default to muted.

## Implementation State
`src/slides/sound.ts`, `spec/21-slides-system/21-sound-system.md`, `43-steps-sound.md`. Settings page exposes mute toggle.

## Gap
None observed.

## Severity
None.

## Evidence
- spec: `spec/21-slides-system/21-sound-system.md`
- impl: `src/slides/sound.ts`
- test: covered indirectly via motion preference tests

## Remediation
None.
