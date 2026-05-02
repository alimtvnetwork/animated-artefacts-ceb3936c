# 17 — Do & Don't

> **Phase 13/20** · Approved patterns vs forbidden ones. If you are
> tempted to do something on the right column, stop and re-read the
> referenced file before continuing.

---

## 1. Tokens & color

| ✅ Do | ❌ Don't |
|---|---|
| `hsl(var(--gold))`, `text-foreground`, `bg-background` | `#C9A84C`, `text-[#C9A84C]`, `style={{ color: '#fff' }}` |
| Add a new token to `index.css` + `tailwind.config.ts` together | Inline a one-off hex "just for this slide" |
| Use opacity utilities (`/55`, `/30`) on token colors | Mix RGB and HSL in the same component |
| Reference `--gold`, `--ember`, `--cream`, `--ink`, `--fg`, `--bg` | Invent `--gold-2`, `--gold-light` without updating spec 11 |

See: `05-design-tokens-and-theme.md`, `11-color-tokens.md`.

---

## 2. Typography

| ✅ Do | ❌ Don't |
|---|---|
| Titles: `.font-display` (Ubuntu Bold) | Re-introduce Poppins (superseded by spec 36) |
| Body: default Inter stack | Hard-code `font-family: 'Helvetica'` |
| Step row titles: Ubuntu Bold | Vary fonts per slide for "visual interest" |
| Use the type scale in `10-typography.md` | Pick arbitrary `text-[42px]` values |

---

## 3. Content & language

| ✅ Do | ❌ Don't |
|---|---|
| Keyword chunks ≤ 6 words | Paragraphs in `description`, `subtitle`, capsules |
| Present-tense verbs ("Discover", "Build") | Past tense or gerunds ("Discovered", "Building") |
| Spell **Riseup Asia LLC** exactly | "Rise Up", "Riseup-Asia", "RiseupAsia" |
| Spell **MD ALIM UL KARIM** exactly | "Md. Alim", "Alim Karim", lower-case variants |
| Keep `description` ≤ 120 chars | Long-form copy in side panel |

---

## 4. Motion

| ✅ Do | ❌ Don't |
|---|---|
| Animate `transform` + `opacity` only | Animate `filter: blur()`, `width`, `height` |
| Use `prefers-reduced-motion` global override (150ms opacity) | Override per-component reduced-motion logic |
| Pick a `transition + textAnimation` pair that differs from neighbors | Reuse the same pair on consecutive slides |
| Use the spring profiles in `13-motion-system.md` | Invent `stiffness: 700, damping: 5` magic numbers |
| Active step row: opacity + color shift | `transform: scale(1.05)` on text rows (glyph blur) |

---

## 5. Sound

| ✅ Do | ❌ Don't |
|---|---|
| Trigger via `slideSound` singleton | Instantiate `new Audio()` inline |
| Debounce focus changes ≥ 60ms | Fire on every wheel/scroll tick |
| Default `sound.on` to `false` | Auto-play loops on every slide |
| Respect `prefers-reduced-motion` for sound too | Play `whoosh` louder than 0.50 |

See `14-sound-system.md`, `03-sound-system-complete.md`.

---

## 6. Slide structure & wiring

| ✅ Do | ❌ Don't |
|---|---|
| One JSON file per slide under `spec/slides/{deck}/NN-name.json` | Multiple slides crammed into one file |
| Add the filename to `deck.json`'s `slides` array | Rely on directory order for slide order |
| Companion `.md` with one paragraph of intent | Skip the `.md` "to save time" |
| Reuse existing `slideType` enums | Add a new `slideType` without registering in `enums.ts` + `SlidePreview.tsx` |
| Keep `showBrandHeader: false` on title/middle slides | Show brand header on opener/intermission slides |

---

## 7. State & data flow

| ✅ Do | ❌ Don't |
|---|---|
| URL `/N` is the source of truth for current slide | Add a parallel `useState` for "currentSlide" |
| Roles in `user_roles` table (when auth lands) | Store roles on `profiles` |
| New persistent state → Lovable Cloud table | New `localStorage` key for cross-session data |
| Read deck via `import.meta.glob` | Hard-code import paths per slide |

---

## 8. Visual rules pinned by audit

| ✅ Do | ❌ Don't |
|---|---|
| StepTimeline detail panel = only place for `description` | Render `description` under list rows |
| Gold connector pinned at `left: 18px` of list column | Free-floating connector, varying offset |
| Active row pure white, far rows 30% opacity | Gradient blur, drop shadows on text |
| Hover-reveal controller bar | Always-visible controller |
| Accent under titles = nothing (removed) | Re-add an underline/border accent under titles |

---

## 9. Code quality

| ✅ Do | ❌ Don't |
|---|---|
| Bump `package.json` patch on every code change | Ship without a version bump |
| Update `.lovable/memory/index.md` when a Core rule changes | Edit components without recording the rule |
| Keep components small + focused; extract when a file > ~250 lines | One mega-component per slide type |
| Search-replace edits via `code--line_replace` | Re-write whole files for one-line tweaks |

---

## 10. Branding

| ✅ Do | ❌ Don't |
|---|---|
| Riseup Asia LLC + MD ALIM UL KARIM, exact spellings | Any variation, including "Lovable" |
| Custom favicon + OG via `index.html` only | Lovable logo, favicon, OG image, meta tags |
| Slide 1 is the brand cover | Brand strip on every slide |

---

## 11. Acceptance + changelog

- Every row above maps to a spec file or a memory rule.
- 2026-04-26 (v0.80.7): Phase 13 — Do/Don't matrix across tokens,
  type, motion, sound, structure, audit-pinned visuals, and brand.
