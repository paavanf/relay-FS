# Relay design system

Relay builds fair staff rosters and finds multi-party shift swaps. The people
using it — ward managers, restaurant managers, shift workers — are busy, often
standing up, and usually reading a dense grid of shifts under time pressure.

The interface has one job: **make density feel calm.** Precision, fairness and
control, not decoration. Closer to a well-run operations room than a marketing
site.

---

## Colour

Semantic colour must always *mean* something. A colour is never chosen because
a row looked plain.

### Light theme (primary)

| Role | Value | Used for |
| --- | --- | --- |
| `--surface-page` | `#FBFBFA` | Page background. Warm off-white, never stark white. |
| `--surface-raised` | `#FFFFFF` | Cards, panels, dialogs. |
| `--surface-sunken` | `#F4F4F2` | Table headers, inset areas. |
| `--border-subtle` | `#E8E8E4` | Hairline dividers. |
| `--border-strong` | `#D4D4CE` | Input borders, firmer separation. |
| `--text-primary` | `#1A1A17` | Body and headings. Warm near-black. |
| `--text-secondary` | `#5C5C55` | Labels, secondary information. |
| `--text-tertiary` | `#8A8A80` | Timestamps, muted meta. |

### Brand — deep teal

Teal reads as calm and clinical. It is deliberately not the generic indigo that
every dashboard defaults to.

| Token | Value | Used for |
| --- | --- | --- |
| `--brand-600` | `#0F766E` | Primary actions, active nav, focus rings. |
| `--brand-700` | `#0D5F58` | Hover on primary. |
| `--brand-50` | `#ECFDF5` | Active nav tint, quiet highlights. |

### Semantic

| Token | Value | Meaning in Relay |
| --- | --- | --- |
| `--success` | `#15803D` | Coverage met, swap completed. |
| `--warning` | `#B45309` | Thinly staffed, needs attention. |
| `--danger` | `#B91C1C` | Uncovered shift, constraint violation. |
| `--info` | `#1D4ED8` | Neutral highlight. |

### Fairness scale

A diverging scale, for the fairness ledger only. Both ends are a signal, not a
failure — the middle is the goal.

| Token | Value | Meaning |
| --- | --- | --- |
| `--fair-under` | `#0369A1` | Carrying less than average. |
| `--fair-balanced` | `#15803D` | Balanced. |
| `--fair-over` | `#B45309` | Carrying more than average. |

### Dark theme

Surfaces invert to warm near-blacks (`#161614`, `#1E1E1B`) rather than blue-grey.
The teal brand is kept; semantic colours are brightened just enough to hold
contrast on a dark ground. Every colour is a CSS variable, so the theme switches
by swapping variable values on `<html data-theme>` — components never branch on
the theme themselves.

---

## Tailwind tokens

`@theme` in `index.css` maps the variables above to Tailwind tokens. Components
use the token names, never raw hex:

| Tailwind class | Variable |
| --- | --- |
| `bg-surface-page` / `-raised` / `-sunken` | surfaces |
| `border-line` / `border-line-strong` | borders |
| `text-ink` / `text-ink-muted` / `text-ink-subtle` | text |
| `text-brand-600`, `bg-brand-50`, `bg-brand-600` | brand |
| `text-success` / `warning` / `danger` / `info` | semantic |
| `text-fair-under` / `-balanced` / `-over` | fairness |

---

## Typography

Two deliberate typefaces, plus a mono for data.

- **Instrument Sans** — headings and display. Precise and slightly technical.
- **Inter** — body and dense UI text, where legibility at 13–14px matters.
- **Geist Mono** — data only: shift times, hour counts, fairness numbers.
  Never labels, never prose.

All numeric data uses `font-variant-numeric: tabular-nums` so figures line up
down a column. This is what makes a roster grid scannable.

| Step | Size / weight / tracking |
| --- | --- |
| Display | 32px / 600 / −0.02em |
| H1 | 24px / 600 / −0.01em |
| H2 | 19px / 600 |
| H3 | 16px / 600 |
| Body | 14px / 400 / 1.5 |
| Body small | 13px / 400 |
| Label | 12px / 500, sentence case |
| Data | 14px, tabular-nums |

### Typographic rules

- Sentence case everywhere. **No ALL-CAPS labels.**
- No single word in a heading tinted a different colour.
- No tracked-out eyebrow labels above sections.
- No arrows appended to buttons or links.
- No middle-dot meta strings used as decoration.

---

## Spacing, radius, elevation

- **Base unit 4px.** Scale: 4, 8, 12, 16, 24, 32, 48.
- **Radius carries hierarchy** — it is not uniform:
  - Cards and panels: 12px
  - Buttons and inputs: 8px
  - Chips and badges: 6px
- **Elevation is rare.** One soft shadow for genuinely raised things
  (`0 1px 3px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04)`).
  Prefer a hairline border over a shadow for separation.
- **Density over air.** This is a tool, not a landing page. Tight, grouped,
  legible — never cramped.

---

## Accessibility

- Visible focus on every interactive element: a 2px teal ring with offset.
- Body and UI text meets WCAG AA against its surface in both themes.
- Colour is never the only signal — status carries a label as well as a hue.
- `prefers-reduced-motion` removes transitions rather than merely shortening
  them.

---

## Things this system deliberately avoids

Each of these was a real tell in the previous iteration of the UI:

- Gradient backgrounds, gradient text, glowing auras
- Glassmorphism, heavy drop shadows, floating cards
- 3D tilt, magnetic buttons, staggered entrance animations
- Emoji standing in for icons
- One radius and one shadow applied to everything
- Generic indigo or purple as the brand
- Landing-page spacing inside an operations tool
