# Koze — design system

Direction: **classic language-learning app** (the category standard, played straight, at Busuu / Babbel finish).
Chosen by the user on 2026-11-21 to replace the "tap-tap" look, which read as brutalist and too big.
Tokens live in `tokens.css`; components in `styles.css` use tokens only.

## Principles
- Neutral page, white surfaces, one blue for actions. Green / red only when they carry meaning (right / wrong answer, streak).
- One elevation per element: a 1px border **or** a soft shadow, never both, never hard offset shadows.
- Two radius tiers: 16px for containers (cards, panels, sheets, the lesson list), 12px for items (buttons, options, inputs, FAQ rows). Pills only for small chips.
- Calm type: Nunito (pinned brand font), titles 700–750, body 400, nothing heavier than 800 (welcome hero only).
- Touch first: every control ≥ 44px; pressed state answers within 50–150ms without moving layout.

## Color (light / dark)
| Role | Light | Dark |
|---|---|---|
| Page ground `--color-bg-primary` | `#f6f7f9` | `#0f1217` |
| Surface `--color-bg-secondary` | `#ffffff` | `#181c24` |
| Well `--color-bg-tertiary` | `#eef0f3` | `#222833` |
| Text `--color-text-primary` | `#1b2230` | `#eceef2` |
| Secondary text | `#5c6577` | `#a3abba` |
| Border | `#e3e6eb` | `#2a303c` |
| Action `--color-accent-primary` | `#2357d9` | `#7ea2ff` |
| Success / error | `#11774f` / `#c0173a` | `#4fd197` / `#ff7f95` |
| "Di l konsa" label | sun `#f5b40a` on `#fff6dc` | `#ffc94a` on `#33280e` |

## Type scale (Nunito)
13 (tags, tab labels) · 15 (secondary) · 16 (body) · 17 (lead, instructions) · 19 (section titles) · 22 (screen titles, phrase prompts) · 24 (h1) · 28 (phrase to learn) · clamp(30–38) welcome hero.

## Components
- **Buttons**: 48px (52px full-width `big`), radius 12, primary solid blue, secondary pale blue, ghost white with strong border; disabled = grey well, not transparency.
- **Next lesson card**: white, soft shadow, title 22, meta line, goal note in a grey well, full-width primary.
- **Lesson list**: one white bordered card per path, rows 56px separated by hairlines; status dot 28px (done = green tint, open = blue, locked = grey).
- **Options / choices**: white, 1px border, selected = blue border + inset 1px ring + pale blue fill; right / wrong in green / red tints.
- **Feedback sheet**: full-width tinted panel at the bottom with the mascot (56px).
- **Mic / play**: 88px circle (slow: 56px), recording = red with a soft pulse.
- **Tab bar**: white, top hairline, icon + label; active = blue, inactive = secondary grey (contrast ≥ 4.5:1).

## Motion
Ease-out-expo for entrances, 150ms for state changes, no bounce. Everything stops under `prefers-reduced-motion`.
