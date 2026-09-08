# Relay design system

Relay builds fair staff rosters and finds multi-party shift swaps. The people
using it — ward managers, restaurant managers, shift workers — are busy, often
standing up, and usually reading a dense grid of shifts under time pressure.

The interface has one job: **make density feel calm.** Precision, fairness and
control, not decoration. Closer to a well-run operations room than a marketing
site.

This file is the reference for all future UI work. The tokens below are defined
in `src/index.css`; nothing else in the codebase may name a colour.

---

## The rules that matter most

1. **Components never name a hue.** They name a role — `bg-surface-raised`,
   `text-content-secondary`, `border-line-subtle`. If you find yourself typing
   `bg-teal-600` or a hex value, a token is missing; add it here first.
2. **`-surface` is only ever a background. `-content` is only ever text or an
   icon.** Never put a `-surface` colour on text, and never put a `-content`
   colour behind text. Pairing two tints of the same family is what made the
   "Log in instead" link invisible.
3. **Dark is designed, not inverted.** A raised surface is *lighter* than the
   one behind it; the brand is *lighter* than in light mode. Inverting the
   light ramp gives muddy, low-contrast greys.
4. **Elevation runs in opposite directions.** In light, raised = lighter +
   a shadow. In dark, shadows barely register, so height comes from surface
   lightness and borders.
5. **Radius and elevation have steps.** One value everywhere reads as flat.

---

## Colour tokens

Both themes define every role. The dark set overrides the light set on
`:root[data-theme='dark']`.

### Surfaces — a four-step ramp

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `surface-base` | `#F7F7F5` | `#141413` | The page itself |
| `surface-raised` | `#FFFFFF` | `#1C1C1A` | Cards, panels, the sidebar, inputs |
| `surface-overlay` | `#FFFFFF` | `#232320` | Dialogs, popovers, toasts |
| `surface-sunken` | `#EFEFEC` | `#101010` | Table headers, inset wells, toggle tracks |
| `surface-hover` | `#F1F1EE` | `#242422` | Row and nav hover |
| `surface-active` | `#E8E8E4` | `#2C2C29` | Pressed state |

Note the direction: in light, hover is *darker* than the surface; in dark it is
*lighter*. Both move away from the resting surface, which is the point. Never
use `surface-sunken` as a hover — in dark mode it moves the wrong way.

### Content — a contrast ladder

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `content-primary` | `#17170F` | `#F2F2EE` | Headings, key data |
| `content-secondary` | `#55554C` | `#A8A89E` | Body copy, labels |
| `content-tertiary` | `#6C6C61` | `#8C8C83` | Timestamps, hints, placeholders |
| `content-inverse` | `#FFFFFF` | `#141413` | Text on a solid brand or semantic fill |

`content-inverse` flips between themes because the fills it sits on do. In dark
mode the brand fill is a light teal, so what goes on top of it is near-black.

### Lines

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `line-subtle` | `#E5E5E0` | `#2A2A27` | Hairline dividers, table rows, card edges |
| `line-strong` | `#84847B` | `#76766D` | Input, select and button borders |
| `line-focus` | `#0F766E` | `#2DD4BF` | Focus rings |

### Brand — deep teal

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `brand-subtle` | `#ECFDF5` | `#0C2925` | Active nav tint, avatar background |
| `brand-border` | `#99E6D5` | `#1B5A52` | Borders on brand-tinted areas |
| `brand-solid` | `#0F766E` | `#14B8A6` | Primary buttons, active indicators, icons |
| `brand-solid-hover` | `#0D5F58` | `#2DD4BF` | Primary button hover |
| `brand-content` | `#0B4F49` | `#5EEAD4` | Brand-coloured **text** |

The brand goes *lighter* in dark mode. A mid-tone teal that reads well on white
is close to unreadable on a near-black page.

### Semantic families — three tokens each

Every family has a `-surface` (background), a `-border`, and a `-content`
(text/icon).

| Family | Light surface / border / content | Dark surface / border / content |
| --- | --- | --- |
| success | `#ECFDF3` / `#A6E9C1` / `#15803D` | `#0D2818` / `#1F5637` / `#4ADE80` |
| warning | `#FEF6E7` / `#F5D08A` / `#92400E` | `#2A1F0A` / `#5C4415` / `#FBBF24` |
| danger | `#FEF0F0` / `#F5B5B5` / `#B91C1C` | `#2A1213` / `#5C2427` / `#F87171` |
| info | `#EFF4FF` / `#B9CCF7` / `#1D4ED8` | `#111C33` / `#223A66` / `#7CA5FB` |

Use the `Callout` component rather than assembling these by hand — it exists to
make rule 2 impossible to get wrong.

A solid semantic fill (the danger button) uses the `-content` colour as its
background with `content-inverse` on top.

### Fairness ledger

A diverging scale, adjusted per theme.

| Token | Light | Dark | Meaning |
| --- | --- | --- | --- |
| `fair-under` | `#0369A1` | `#38BDF8` | Below their share |
| `fair-balanced` | `#15803D` | `#4ADE80` | On their share |
| `fair-over` | `#B45309` | `#FBBF24` | Above their share |

### Scrim

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `scrim` | `#17170F` | `#000000` | The veil behind a dialog, at 40% |

This is its own token on purpose. It was previously the content colour, which
is near-white in dark mode — so the dialog backdrop *lightened* the page
instead of dimming it.

---

## Elevation

Three steps, applied with the `.elevation-sm` / `.elevation-md` /
`.elevation-lg` classes.

| Step | Light | Dark | Used for |
| --- | --- | --- | --- |
| `elevation-sm` | `0 1px 2px rgb(23 23 15 / .06)` | `0 1px 2px rgb(0 0 0 / .4)` | Cards |
| `elevation-md` | `0 2px 8px / 0 1px 2px` | `0 2px 8px rgb(0 0 0 / .5)` | Popovers, toasts |
| `elevation-lg` | `0 8px 24px / 0 2px 6px` | `0 8px 24px rgb(0 0 0 / .6)` | Dialogs |

**These are deliberately not Tailwind `shadow-*` utilities.** Tailwind resolves
`--shadow-*` at build time and inlines the value into the class, so overriding
it under `[data-theme]` silently does nothing — the dark shadows would be dead
CSS. The `.elevation-*` classes read a plain custom property at runtime, which
is what lets the two themes carry genuinely different shadows.

In dark mode the shadow is only there to seat an edge. The surface ramp is what
actually conveys height.

---

## Radius

Deliberate steps, not one value everywhere.

| Token | Value | Used for |
| --- | --- | --- |
| `rounded-sm` | 6px | Badges, chips, small icon buttons, skeletons |
| `rounded-md` | 8px | Buttons, inputs, selects, nav items |
| `rounded-lg` | 12px | Cards, tables, toasts, popovers |
| `rounded-xl` | 16px | Dialogs |

---

## Typography

Two typefaces, plus a mono face reserved for data.

- **Headings** — Instrument Sans, applied to `h1`–`h4` in the base layer
- **Body and UI** — Inter
- **Data cells** — Geist Mono, via the `.data` class, for times and hour counts

### Scale

| Token | Size / weight | Used for |
| --- | --- | --- |
| `text-display` | 32 / 600 | The largest page statement |
| `text-h1` | 24 / 600 | Page titles |
| `text-h2` | 19 / 600 | Section headings |
| `text-h3` | 16 / 600 | Card and dialog titles |
| `text-body` | 14 / 400 / 1.5 | Default body |
| `text-body-sm` | 13 / 400 | Dense secondary text |
| `text-label` | 12 / 500 | Field labels, table headers |

Each token carries its own weight, so `text-h1 font-semibold` is redundant.

`font-variant-numeric: tabular-nums` is applied globally to `table`, `th`, `td`,
`time` and `[data-numeric]`, so columns of figures line up. This is the single
thing that makes a dense roster scannable.

---

## Forbidden

- ALL-CAPS labels and tracked-out eyebrows
- A single accent-coloured word inside a heading
- "→" appended to button labels
- Middle-dot meta strings used as decoration
- Gradients, glows, or a coloured shadow
- Any raw hex value or Tailwind palette colour (`teal-600`, `amber-100`) in a
  component
- A `-surface` token on text, or a `-content` token as a background

---

## Theme switching

- The choice is three-state: **system**, **light**, **dark** — `system` is the
  default and keeps following the OS when it changes at sunset. That is why it
  is a distinct state and not just "light on a light machine".
- The resolved theme is a `data-theme` attribute on `<html>`.
- An inline script in `index.html` sets that attribute **before first paint**,
  so there is no flash of the wrong theme. It must stay in step with
  `src/features/theme/themeStorage.js` — same storage key, same three states.
- `<meta name="color-scheme" content="light dark">` makes native form controls
  and scrollbars follow the theme.
- `<meta name="theme-color">` is updated to match the resolved theme.

---

## Accessibility floor

Verified numerically against every token pair the UI can produce, in both
themes:

- **4.5:1** for text on every surface it comes to rest on (`base`, `raised`,
  `overlay`, `sunken`)
- **3:1** for control borders, focus rings and icons, on every surface
  including the transient `hover` and `active` fills
- Every interactive element has a visible `:focus-visible` ring drawn in
  `line-focus`
- `prefers-reduced-motion` removes animation outright rather than shortening it

Two values differ from the original brief because the brief's own numbers could
not meet this floor: `line-strong` (an input border at `#CFCFC7` was 1.57:1
against white, where WCAG 1.4.11 requires 3:1) and `content-tertiary` (which
carries timestamps, i.e. body text, so it needs 4.5:1 rather than the 3.73:1 it
started at).
