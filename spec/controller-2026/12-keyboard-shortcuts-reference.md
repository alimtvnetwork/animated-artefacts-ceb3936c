# 12 — Keyboard Shortcuts Reference

> The concrete key map for the controller. This mirrors the **single source of
> truth**, the `SHORTCUTS` array in
> `src/slides/controls/KeyboardShortcutsDialog.tsx`. The controller's `/` dialog
> and the hamburger "Keyboard map" item both render from that array — never
> hand-maintain a second list. Update the array first, then sync this table.
>
> All keys are **single-press, no modifier** (except where noted) and are
> ignored while an `INPUT` / `TEXTAREA` / `contentEditable` is focused.

## Deck navigation

| Key(s) | Action |
|--------|--------|
| `→` / `Space` / `Enter` | Next slide |
| `←` / `Backspace` | Previous slide |
| `G` | Toggle slide overview |
| `F` | Toggle fullscreen |
| `J` | Toggle top slide jumper |
| `Esc` | Exit fullscreen / close overlay |
| `/` | Open keyboard map dialog |

## Quick jump (slide number)

| Key(s) | Action |
|--------|--------|
| `0`–`9` | Type slide number (e.g. `1` `2`) |
| `Enter` | Jump to typed slide number |
| `Backspace` | Delete last digit |
| `Esc` | Cancel pending jump |

## Sidebar (TOC outline)

| Key(s) | Action |
|--------|--------|
| `Ctrl` + `1` (`⌘` + `1` on macOS) | Toggle slide outline sidebar |
| `Esc` | Close sidebar when open |

## Presenter webcam

> Full behaviour, active phases and edge cases live in
> [`../camera-2026/03-shortcuts-and-controls.md`](../camera-2026/03-shortcuts-and-controls.md).
> This is the short reference as surfaced by the controller dialog.

| Key(s) | Action |
|--------|--------|
| `I` | Hard toggle webcam (stops tracks ↔ re-acquire) |
| `M` | Minimize / restore webcam |
| `F` | Auto-frame face |
| `+` / `−` | Resize webcam |
| `H` | Toggle soft halo (default off) |
| `1` | Stage-fill (cover slide) |
| `O` | Cycle shape: rect → circle → circle + glow |
| `P` | Enter webcam fullscreen |
| `[` | Exit fullscreen (plain) |
| `]` | Cinematic 3-state cycle |
| `Esc` | Exit fullscreen / stage |

## Where each shortcut is wired

- **Source of truth:** `SHORTCUTS` in
  `src/slides/controls/KeyboardShortcutsDialog.tsx`.
- **`/` help dialog + hamburger "Keyboard map":** render from `SHORTCUTS`.
- **Deck/nav listeners:** `ControllerBar.tsx` and the deck capture handler.
- **Webcam listeners:** the camera hook (see camera-2026 file 01 + 03).
