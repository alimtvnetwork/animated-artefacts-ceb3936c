# 07 — Meeting link (compact QR slide)

A focused meeting-link slide that uses the **compact** layout of
`QrMeetingSlide` (the contact card on /6 uses the full layout). Built per the
"meeting-link slide section with a QR code and title capsule using
Riseup Asia LLC branding" request.

## Layout

The compact path triggers when neither `contactRows` nor `cta` is set on
the content — see `src/slides/types/QrMeetingSlide.tsx#CompactLayout`. The
result is a single rounded surface with:

- **Left**: 260px branded QR rendered by `BrandedQR`, asset
  `riseup-meeting` from the registry.
- **Right**: eyebrow → title → subtitle → meetingLabel → capsule row.

## Branding

- `titleStyle: "gold"` + `titleShimmer: true` runs the one-shot Awwwards
  highlight sweep across "Scan to meet with Riseup Asia LLC" (no
  always-on gradient — see `mem://features/slide-spec-format`).
- The first capsule is **"Riseup Asia LLC"** in gold — the canonical brand
  mark per the project memory's *exact spelling* rule.
- Remaining capsules (`30-min intro` / `Free of charge` / `MD ALIM UL KARIM`)
  set audience expectations: meeting length, cost, and presenter.
- BrandHeader + presenter chip are visible so the wordmark and Alim chip
  bracket the slide using the `--brand-inset-x` token.

## Where it lives

- Linear position 7 in the showcase deck.
- Registered in `spec/slides/showcase/deck.json`.
