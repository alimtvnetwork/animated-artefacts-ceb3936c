# 08 — Background System

> **Phase 8/20** · How to paint the canvas for any non-title slide. The
> title slide has its own playbook in `09-title-background.md`.

## 1. Default surface — `--ink`

Every slide starts as a solid `hsl(var(--ink))` (`#0D0D0D`) plate. This
is the canvas baseline; ambient layers paint on top, never replace.

```css
.slide-stage { background: hsl(var(--ink)); }
```

## 2. Layer stack (bottom → top)

| z | Layer | Source | Mounted by |
|---|---|---|---|
| 0 | Ink plate | `--ink` | `SlideStage` (CSS background only) |
| 1 | Ambient field | `<AmbientBackground variant="…" />` | **the slide-type component** (NOT `SlideStage`) |
| 2 | Slide body | the slide-type component itself | the slide-type component |
| 3 | Brand header | `<BrandHeader />` | `SlideStage` (reads `slide.showBrandHeader`) |
| 4 | Brand strip | `<BrandStrip />` | `SlideStage` (reads `slide.showBrandStrip`) |
| 5 | Controller | `<ControllerBar />` | deck root (single instance, shared across slides) |

**Ownership rule (resolves Audit-16 §2.2):** `SlideStage` is the chrome
host — it paints the ink plate and conditionally mounts the brand
header/strip from JSON flags. It does **not** read `content.titleAmbient`
or `content.stepAmbient`; the slide-type component is solely responsible
for mounting its own `<AmbientBackground />` at z=1 inside its own root.
This is why ambient JSON lives under `content.*Ambient` (a slide-type
contract), never under top-level slide flags.

Ambient (z=1) is the **only** layer that may overlap the slide body
visually. Everything above z=2 must respect content boundaries from
spec 07 §3 (the 1440 centered grid).

## 3. Sandwich rule

Across a deck, alternate dark vs. ambient-rich slides to give the eye
rhythm:

| Position | Background |
|---|---|
| Title slide (1) | **Dark + cinematic ambient** (`constellation`) |
| Content slides | Dark ink + subtle ambient (`drift`, `breath`) |
| Section divider | **Dark + bold ambient** (`pulse` or `sweep`) |
| Conclusion / contact | Dark + cinematic ambient again |

The deck never goes light-mode. "Sandwich" here means motion intensity,
not luminance — opening + closing slides feel **alive**, the middle
feels **calm** so content reads.

## 4. Allowed gradient patterns

When a slide needs a subtle gradient (rare), use only these tokens:

```css
/* radial spotlight from top-center */
background:
  radial-gradient(ellipse at 50% 0%, hsl(var(--gold) / 0.08), transparent 60%),
  hsl(var(--ink));

/* ember corner accent */
background:
  radial-gradient(circle at 100% 100%, hsl(var(--ember) / 0.06), transparent 50%),
  hsl(var(--ink));
```

Both stay **inside** the gold/ember/cream/ink palette and use opacity
to dim, never raw hex.

## 5. Forbidden patterns

- Raw hex anywhere in JSX or CSS components — only `hsl(var(--token))`.
- Pure white (`#FFFFFF`) as a background — breaks the dark-deck contract.
- Linear gradients between off-token colors (e.g. blue → purple). The
  palette is locked.
- Setting `background-image: url(...)` on a slide root. Background art
  belongs in `<AmbientBackground>` so it inherits the layer stack.
- Box-shadow on the slide root — shadows belong on inner cards / chips.

## 6. Per-slide override

In JSON, authors may set:

```json
{ "background": { "ambient": "drift" } }
```

`ambient` ∈ `none | drift | breath | pulse | sweep | constellation`.
Default is `drift`. `none` disables the ambient layer (use sparingly —
the slide can read flat).

## 7. Acceptance

- Inspector shows the slide root has `background: hsl(var(--ink))` —
  literally that string, not a hex.
- Toggling ambient `none` removes the z=1 layer cleanly without shifting
  body content.
- A grep for `#[0-9a-fA-F]{6}` in `src/slides/types/*.tsx` returns zero
  matches.

## 8. Open questions & changelog

- Open: section dividers — accent gradient or token-only? Default: token.
- 2026-04-26 (v0.80.2): Phase 8 — layer stack + sandwich + forbidden.
