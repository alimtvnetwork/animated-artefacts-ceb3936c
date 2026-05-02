# QrMeetingSlide — authoring guide

**Purpose**: Closer / contact card. QR + meeting URL + amber-tile contact rows + bare socials. Canonical "contact card" recipe.

**Template**: [`QrMeetingSlide.json`](./QrMeetingSlide.json)

---

## When to use

- Final slide of every deck. Always.
- Any standalone "book a meeting" interstitial.

## Required content fields

| Field        | Type     | Notes                                 |
|--------------|----------|---------------------------------------|
| `title`      | `string` | Two-tone wordmark — usually presenter or org. |
| `meeting`    | object   | `{ url, label, qrAsset }` — see below. |
| `contactRows`| `Row[]`  | Amber-tile rows: phone, email, etc.   |
| `socials`    | `Social[]` | Bare social links incl. Facebook (REQUIRED per house rule). |

## Meeting block

Resolved from `deck.assets.qr` if `qrAsset` matches a registered slug, otherwise from the QR registry. Hard-fails at boot if the slug doesn't resolve. See [`mem://features/asset-registry`](../../.lovable/memory/features/asset-registry.md).

```json
"meeting": {
  "url": "https://meet.rasia.pro/intro-call",
  "label": "meet.rasia.pro/intro-call",
  "qrAsset": "riseup-meeting"
}
```

## House rules

- Wordmark is two-tone (white + cream).
- QR finder pattern is **red** (not gold) — designer-locked.
- Contact rows use amber tile chrome with a CTA at the end.
- Socials are bare (icon-only), no labels.
- **Facebook MUST be included** — house style rule.
- Entrance is `fade + lift`; **no Ken-Burns scale** (user-rejected).

## Related specs

- [`spec/slides/19-contact-card-v2.md`](../../spec/slides/19-contact-card-v2.md) — canonical contract (supersedes 12).
- [`mem://features/contact-card-v2`](../../.lovable/memory/features/contact-card-v2.md).
- [`spec/slides/09-qr-and-hover.md`](../../spec/slides/09-qr-and-hover.md) — BrandedQR + lift-hover tokens.
