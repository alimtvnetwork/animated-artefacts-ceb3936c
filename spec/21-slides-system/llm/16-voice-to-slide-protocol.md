# 16 — Voice-to-Slide Protocol

> **Phase 13/20** · How an LLM turns a voice/text brief into a single
> slide JSON file. This is the contract: ask the right questions,
> apply the right defaults, and emit a valid spec without round-trips.

---

## 1. The 60-second intake

When the user says *"add a slide that …"*, resolve **these six
questions in order**. If the brief already answers a question, skip
it. Otherwise apply the listed default — do **not** stop to ask unless
the question is starred (★).

| # | Question | Default if unspecified |
|---|---|---|
| 1 | **What slide type?** (see decision tree §2) | infer from intent keywords |
| 2 | **What deck?** (`showcase`, custom) | `showcase` |
| 3 | **Where in the deck?** (slide N) | append to end of `deck.json` |
| 4 | **Title + eyebrow + subtitle?** | extract verbatim, distill to ≤6 words |
| 5 | **Transition + textAnimation pair?** | pick a pair that differs from N-1 and N+1 (variety rule) |
| 6 | ★ **Sound on this slide?** | `false` unless brief mentions whoosh/click/ambience |

★-questions are the only ones worth a clarifying turn. Everything
else: pick the default, write the spec, let the user iterate.

---

## 2. Intent → slideType decision tree

Match the user's verb/noun against this table. First match wins.

| Brief contains… | `slideType` |
|---|---|
| "title", "opener", "cover" | `TitleSlide` |
| "section break", "chapter divider" | `SectionDividerSlide` |
| "middle title", "act break", "intermission" | `MiddleTitleSlide` |
| "list of capabilities", "tags", "labels" | `KeywordSlide` or `CapsuleListSlide` |
| "process", "steps", "phases", "timeline" | `StepTimelineSlide` |
| "frame by frame", "reveal one at a time", "dolly" | `AdvanceStepSlide` |
| "single big focus", "spotlight", "hero stat" | `FocusTimelineSlide` |
| "QR", "meeting link", "contact card" | `QrMeetingSlide` |
| "image", "screenshot", "photo" | `ImageSlide` |

If the brief mixes two intents (e.g. "process AND QR"), pick the
**dominant** one and put the secondary asset in the side panel or as
a follow-up slide. Do **not** invent a hybrid type.

---

## 3. Content distillation rules

The slide is a **visual anchor**, not a script. Distill aggressively.

1. **Strip filler.** "We help our clients to discover…" → "Discovery".
2. **One concept per row.** If a sentence has two ideas, split into
   two `steps[]` entries.
3. **≤ 6 words per chunk.** `title`, `eyebrow`, `description`.
4. **No punctuation at chunk end.** No trailing period in capsule
   labels or eyebrows.
5. **Verbs in present tense.** "Discovering" → "Discover".
6. **Keep brand spellings exact.** Riseup Asia LLC. MD ALIM UL KARIM.

If the brief is a paragraph: extract 3–5 keyword chunks and ask the
user *only* if you cannot find that many.

---

## 4. Defaults the LLM owns (do not ask)

| Field | Default | Source |
|---|---|---|
| `showBrandHeader` | `true` (false on `TitleSlide`, `MiddleTitleSlide`) | `15-authoring-template.md` |
| `brandStrip` | `false` | spec 08 |
| `background.ambient` | `drift` | `04-ambient-and-title-background.md` |
| `transition` | rotate among `FadeIn`, `SlideIn`, `PushIn` | `13-motion-system.md` §2 |
| `textAnimation` | rotate among `SlideUp`, `Stagger`, `FadeIn` | `13-motion-system.md` §3 |
| `sound.on` | `false` | `14-sound-system.md` |
| `capsule.kind` | `gold` for primary, `outline` for neutral | `12-steps-pattern.md` |

---

## 5. Variety guard (mandatory pre-write check)

Before writing the JSON file:

1. Open `spec/slides/{deck}/deck.json`.
2. Read `transition + textAnimation` of the slide at index N-1 and N+1.
3. Pick a pair for the new slide that matches **neither** neighbor.
4. If only one variant remains unblocked, prefer it. If the deck is
   short (<3 slides), variety is best-effort.

---

## 6. Writing the files (atomic 3-step output)

Always emit these **three artifacts in one turn**, never partials:

1. `spec/slides/{deck}/NN-name.json` — the spec (runtime source of
   truth).
2. `spec/slides/{deck}/NN-name.md` — one paragraph of design intent.
   No code, no JSON repetition.
3. Patched `spec/slides/{deck}/deck.json` — append filename to the
   `slides` array at the chosen index.

Then bump `package.json` patch version.

---

## 7. Worked example (voice → JSON)

> **User says:** *"Add a slide after the title that lists our four
> capabilities: strategy, design, build, and growth. Use gold capsules."*

LLM resolves:

- slideType → `CapsuleListSlide` (keyword + label intent)
- deck → `showcase`, position → 2 (after title)
- title → "Capabilities" (distilled from "our four capabilities")
- capsules → 4 entries, `kind: "gold"`
- transition → `SlideIn` (slide 1 was `FadeIn`)
- textAnimation → `Stagger` (matches list reveal)
- sound → off (not mentioned)

Then emits the three files + version bump. No clarifying questions
needed because every slot had a default or a derivable value.

---

## 8. When to break protocol and ask

Only stop and ask the user when:

- The brief is ambiguous between **two top-level slide types** and
  the choice changes the layout (e.g. process vs. focus).
- The brief asks for a slide type that does not exist (offer the
  closest match + the option to add a new type — file 01).
- The brief asks for **hotspots** (`content.hotspots[]`, see file 21).
  A blind LLM cannot see the rendered slide, so it cannot guess
  `(x, y, width, height)` percentages of where a word or image region
  sits on the 1920×1080 stage. **Never hallucinate hotspot coordinates.**
  Either: (a) ask the user for the four numbers per region, or (b) use
  capsule-based reveals (`capsule.revealSlide`) instead — capsules render
  themselves so the LLM doesn't need to know their position.

---

## 9. Acceptance + changelog

- All 6 intake questions resolved (5 by default, 1 starred only if
  needed).
- Variety guard passed against both neighbors.
- 3 artifacts emitted atomically + version bumped.
- 2026-04-26 (v0.80.7): Phase 13 — voice intake protocol, intent
  decision tree, distillation rules, variety guard.
