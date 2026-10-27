# Relay design system

Relay builds fair staff rosters and finds multi-party shift swaps. The people
using it - ward managers, restaurant managers, shift workers - are busy, often
standing up, and usually reading a dense grid of shifts under time pressure.

The interface has one job: **make density feel calm, and make what matters
stand out.** Confident and alive, with colour that carries meaning, real
depth and type with character - but a serious operations tool, closer to a
well-run control room than a marketing site.

This file is the reference for all UI work. The tokens below are defined in
`src/index.css`; nothing else in the codebase may name a colour.

**History, so nobody aims wrong.** The first design was rejected as
*childish* (gradients, emoji, toy-like). The second was rejected as *dull*:
warm off-white neutrals within a few percent of each other, a teal used only
on buttons, shift colours borrowed from pale status tints, a 1px shadow
nobody could see, and a compressed type scale. This one sits between the two.

---

## The rules that matter most

1. **Components never name a hue.** They name a role - `bg-surface-raised`,
   `text-content-secondary`, `bg-shift-night-surface`. If you find yourself
   typing a hex value or a Tailwind palette colour, a token is missing; add it
   here first.
2. **`-surface` is only ever a background. `-content` is only ever text or an
   icon. `-solid` is a meter, a dot, an edge, or a fill under inverse text.**
   Pairing two tints of one family is what once made a link invisible.
3. **Colour means one thing.** Shift categories are cool - they follow the
   sky. Warm colours mean attention: amber is thin or waiting, red is short,
   refused or unfilled. Green is covered or done. A hue appears only where it
   means something.
4. **Never colour alone.** Every category has an icon; every status has a
   word or a number beside it.
5. **Dark is designed, not inverted.** A raised surface is *lighter* than the
   one behind it; the brand is *lighter* than in light mode; depth comes from
   the surface ramp, borders and a one-pixel top highlight.
6. **Not every box is a card.** Three elevations, and containers shaped for
   their job: the grid is the one big raised panel, summary tiles carry a
   status edge, toolbars are slim strips, sections on the landing page are
   separated by hairlines.

---

## Colour

Both themes define every role. The dark set overrides the light set on
`:root[data-theme='dark']`. Every text pairing below is at least 4.5:1, and
every line, focus ring, icon, meter fill and edge at least 3:1, on every
surface it can sit on, in both themes (132 pairs checked when this was
designed, plus the rail's own).

### Surfaces

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `surface-base` | `#EDF1F2` | `#132023` | The page: cool, crisp, a trace of the teal - never cream |
| `surface-raised` | `#FFFFFF` | `#1A2B30` | Panels, the grid, tiles, the top bar, inputs |
| `surface-overlay` | `#FFFFFF` | `#22363C` | Dialogs, popovers, toasts |
| `surface-sunken` | `#E2E8EA` | `#0D1719` | Table headers, meter tracks, wells |
| `surface-hover` / `-active` | `#EAF0F1` / `#DCE5E7` | `#243841` / `#2C4249` | Row and control states |
| `surface-weekend` / `-weekend-head` | `#EEF3F4` / `#D8E1E4` | `#1F3136` / `#152429` | The roster's weekend band - in dark a slight lift, not a dark well |

In light, hover is *darker* than the surface; in dark it is *lighter*. Both
move away from the resting surface, which is the point.

### The rail

The navigation sits on its own deep ink-teal tone in both themes - light
content beside a dark rail in light mode, and the darkest tone of all in dark
mode - so chrome and content never share a plane. Any element marked
`data-surface="rail"` gives the ordinary tokens rail values inside it, so the
sidebar's components need no colours of their own: the app's sidebar and
drawer, the landing page's nav, hero band and closing panel, and the auth
pages' brand panel all use it.

| Inside the rail | Light | Dark |
| --- | --- | --- |
| `surface-raised` (the rail) | `#0E2B2F` | `#061113` |
| `surface-hover` / `-active` | `#163A3F` / `#1D4A50` | `#0E1E21` / `#15302F` |
| `content-primary` / `-secondary` / `-tertiary` | `#FFFFFF` / `#B9CFD2` / `#93B1B5` | `#FFFFFF` / `#A9C0C3` / `#86A2A6` |
| `brand-solid` (indicator, active icon, badge, primary button) | `#45D6C2` | `#45D6C2` |
| `content-inverse` (text on that) | `#0E2B2F` | `#061113` |
| `line-subtle` / `line-strong` / `line-focus` | `#22474C` / `#6F9499` / `#45D6C2` | `#1A3135` / `#6F9499` / `#45D6C2` |

### Content and lines

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `content-primary` | `#0D1B1E` | `#E8F1F2` | Headings, key data |
| `content-secondary` | `#3F5157` | `#B3C5C8` | Body copy, labels |
| `content-tertiary` | `#56676C` | `#9AAFB3` | Hints, timestamps |
| `content-inverse` | `#FFFFFF` | `#0B1A1C` | Text on a solid brand or status fill |
| `line-subtle` | `#D3DCDF` | `#2A3F45` | Hairlines, table rows, panel edges |
| `line-strong` | `#6F8186` | `#6A8388` | Control borders |
| `line-focus` | `#0A7568` | `#3ED3BE` | Focus rings |

### Brand - deep teal, with structural weight

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `brand-subtle` | `#DDF4EF` | `#0F3330` | Selected tints, avatars |
| `brand-border` | `#92D5C9` | `#1E5D55` | Borders on brand-tinted areas |
| `brand-solid` / `-hover` | `#0A7568` / `#075F55` | `#2EC4AE` / `#52D7C3` | Primary actions, active indicators |
| `brand-content` | `#06594F` | `#63DCC8` | Brand-coloured text |

### Shift categories - the sky through the day

A shift's colour says when it is, and its lightness follows the sky: day is
light, evening mid-tone, night dark and solid - a night-heavy week looks dark
at a glance. Each also has its own icon (`Sun`, `Sunset`, `Moon`), in
`components/ui/shiftCategories.js`; `CategoryBadge` is the label form. All
three hues are cool, so warm stays "attention".

| Category | Light: surface / edge / content | Dark: surface / edge / content |
| --- | --- | --- |
| Day | `#DCEEFB` / `#2F80C7` / `#0B3D66` | `#133A57` / `#5AAEEB` / `#D3E9FB` |
| Evening | `#DDD4FA` / `#6A4BD0` / `#2E1D6B` | `#2E2660` / `#9D85F2` / `#E1DAFD` |
| Night | `#22306E` / `#22306E` / `#FFFFFF` | `#3341A8` / `#B6C1FF` / `#FFFFFF` |

The edge is a block's or card's solid left border and the icon colour on an
ordinary surface. In dark the night block is the most saturated of the three,
so it still stands out on a dark page.

### Status families - warm means attention

| Family | Light: surface / border / content / solid | Dark: surface / border / content / solid | Means |
| --- | --- | --- | --- |
| success | `#E1F5E9` / `#8FD3AB` / `#12693A` / `#178A47` | `#0F2A1C` / `#1F5A3A` / `#5ED993` / `#36B56C` | Covered, approved, done |
| warning | `#FDF0D5` / `#F0C36A` / `#8A4B06` / `#B06E05` | `#2D220C` / `#6A4C12` / `#F5BE4C` / `#E8A21E` | Thin, waiting for someone |
| danger | `#FCE8E8` / `#F0A9A9` / `#A51D1D` / `#D33434` | `#2E1416` / `#6B2A2E` / `#FF8A8A` / `#E5484D` | Short, refused, unfilled |
| info | `#E3EEFB` / `#A9C6EE` / `#1D4FA8` / `#2F6FD6` | `#11223D` / `#284A80` / `#8DB4FA` / `#4D8BF0` | Neutral notices (the demo strip) |

Use the `Callout` component rather than assembling these by hand. Swap states
use the families too: waiting (for everyone, or for a manager) is warning,
done is success, declined, cancelled or expired is neutral, failed is danger,
and an open offer is brand.

### Fairness - diverging

| Token | Light | Dark | Meaning |
| --- | --- | --- | --- |
| `fair-under` | `#1F6FB8` | `#6BB2F0` | Below their share (cool) |
| `fair-balanced` | `#22804D` | `#5ED993` | On it |
| `fair-over` | `#C25E14` | `#F59A4A` | Above it - warm, the one to act on |

### Scrim

`scrim` is `#0D1B1E` in light and `#000000` in dark, used at 40% behind a
dialog. It is its own token on purpose: it must darken the page in both
themes, so it can never be the content colour.

### Someone else's brand

Google's mark on "Continue with Google" keeps Google's own four colours in
both themes, because Google's branding rules ask for them. They are tokens
like every other colour (`google-blue`, `google-green`, `google-yellow`,
`google-red`), used by `GoogleSignIn.jsx` alone and never for anything of
Relay's.

---

## Depth

| Level | Light | Dark | Used for |
| --- | --- | --- | --- |
| Page | `surface-base`, no shadow | `surface-base` | The ground |
| Raised (`elevation-sm`) | white, hairline, `0 1px 2px / .06` + `0 4px 12px / .07` | lighter surface, hairline, 1px top highlight, `0 1px 2px` black at .5 | The grid, panels, tiles, cards |
| Floating (`elevation-md`) | `0 4px 12px / .10` + `0 1px 3px / .06` | top highlight, `0 8px 24px` black at .45 | Popovers, toasts, the landing's closing panel |
| Overlay (`elevation-lg`) | `0 16px 40px / .18` + `0 4px 12px / .08` | top highlight, `0 16px 40px` black at .55 | Dialogs, the landing hero's roster window |

Light shadows are a neutral teal-black (`rgb(13 27 30)`), never coloured.
**These are deliberately not Tailwind `shadow-*` utilities**: Tailwind
resolves `--shadow-*` at build time and inlines the value, so a
`[data-theme]` override would silently do nothing. The `.elevation-*`
classes read a plain custom property at runtime.

Plus the structural contrast of the rail, described above.

---

## Radius

| Token | Value | Used for |
| --- | --- | --- |
| `rounded-sm` | 6px | Badges, chips, shift blocks, small icon buttons |
| `rounded-md` | 8px | Buttons, inputs, selects, nav items |
| `rounded-lg` | 12px | Panels, tables, tiles, toasts |
| `rounded-xl` | 16px | Dialogs, the landing page's large panels |

---

## Typography

- **Archivo** for headings and big figures. Its width axis is the voice: page
  titles are set semi-expanded (112%) and tight (-0.015em), section headings
  a little wide (106%), the landing headline wider still (115%). Applied to
  `h1`-`h4` in the base layer; `font-display` elsewhere (day numbers, summary
  figures, the wordmark, diagram initials).
- **Inter** for body and UI text. A heading styled as a small section label
  inside a panel adds `font-sans`, so it stays a label rather than turning
  wide.
- **Geist Mono** for times and hours, via the `.data` class.

All three come from Google Fonts, which the Content-Security-Policy in
`vercel.json` already allows (`style-src` fonts.googleapis.com, `font-src`
fonts.gstatic.com).

| Token | Size / weight | Used for |
| --- | --- | --- |
| `text-display` | 48 / 800, line 1.04 | The landing headline (`text-h1` on a phone) |
| `text-h1` | 30 / 750, line 1.12 | Page titles, landing section titles |
| `text-h2` | 20 / 700, line 1.25 | Section headings |
| `text-h3` | 16 / 650, line 1.35 | Panel and dialog titles, week headings |
| `text-stat` | 30 / 700, line 1.05 | Summary figures |
| `text-body` | 14 / 400, line 1.5 | Body |
| `text-body-sm` | 13 / 400 | Dense text |
| `text-label` | 12 / 500, sentence case | Labels, table headers |

A page title is 2.1x the body text, the landing headline 3.4x. Each token
carries its own weight. `font-variant-numeric: tabular-nums` is applied to
`table`, `th`, `td`, `time` and `[data-numeric]`, so columns of figures line
up.

---

## Visual language

Every visual is built from real data, and none is decorative.

- **Shift blocks.** On the roster each shift is a block in its category's
  colour, with a solid left edge, its icon, its name and its times
  (`ShiftCell`). Shift cards (My shifts, the landing page) carry the same
  edge and a `CategoryBadge`.
- **Coverage meters.** Each day's coverage cell is a bar filled to
  filled/needed in its status colour, with the fraction beside it.
- **Summary tiles.** `SummaryTile`: a label, a large figure in the display
  face, a line of detail, and a status edge when the figure is good or bad.
  The Schedule page's strip has days covered (a bar per day in its coverage
  colour), shifts rostered, unfilled and swaps waiting.
- **Status edges.** A 4px left edge in a status colour marks what needs
  attention: the unfilled panel (danger), a covered roster (success), a
  summary tile. The landing page's scenario figures carry it on top.
- **Diverging bars.** Fairness deviation grows right (warm) or left (cool) of
  a centre line, full length at 30%.
- **Empty states.** Small line drawings in token colours
  (`components/illustrations`): a calendar, a swap ring, a scale, a bell, a
  settings panel. No faces, no mascots, decorative to a screen reader.
- **The chain diagram** keeps its fixed geometry - circles, curves and
  arrowheads are worked out in `chainLayout.js` and must not be changed for
  looks. Only its colours and type follow the system.
- **The landing hero** is a full-width band in the rail's tone, with the real
  generated sample roster raised over its edge.

---

## Forbidden

- Cream backgrounds with a terracotta accent; near-black with acid green
- Identical rounded cards with the same soft shadow everywhere
- Gradients, gradient washes, glows, coloured shadows, decorative blobs
- ALL-CAPS labels and tracked-out eyebrows
- Emoji, mascots, illustrations with faces
- Rainbow colouring: a hue that means nothing
- A single accent-coloured word inside a heading; "→" appended to button labels
- Any raw hex value or Tailwind palette colour in a component
- A `-surface` token on text, or a `-content` token as a background

---

## Theme switching

- The choice is three-state: **system**, **light**, **dark** - `system` is the
  default and keeps following the OS. The resolved theme is a `data-theme`
  attribute on `<html>`.
- An inline script in `index.html` sets that attribute **before first paint**,
  so there is no flash of the wrong theme. It must stay in step with
  `src/features/theme/themeStorage.js` - same storage key, same three states,
  same `theme-color` values (`#EDF1F2` light, `#132023` dark, the page). The
  script is allowed by its hash in `vercel.json`'s Content-Security-Policy:
  change one character and `vercelConfig.test.js` fails with the new hash.
- `<meta name="color-scheme" content="light dark">` makes native controls and
  scrollbars follow the theme.

---

## Reviewing a visual change

`e2e/specs/design-review.spec.js` screenshots every page, an empty state and
a dialog, in both themes at 1440px and 375px, into
`e2e/artifacts/<DESIGN_SET>/`. It only runs when asked:

```bash
DESIGN_SET=before npm run e2e -- design-review   # before the change
DESIGN_SET=after npm run e2e -- design-review    # after it
```

`vite preview`, which the suite runs on, sends `vercel.json`'s security
headers, so a style or script the production CSP would block shows up there
as a console error, and fails the run.

---

## Accessibility floor

Verified numerically against every token pair the UI can produce, in both
themes, and by the axe checks in the end-to-end suite:

- **4.5:1** for text on every surface it comes to rest on (`base`, `raised`,
  `overlay`, `sunken`, and the rail's own)
- **3:1** for control borders, focus rings, icons, meter fills and edges, on
  every surface including the transient `hover` and `active` fills
- Every interactive element has a visible `:focus-visible` ring in
  `line-focus` - bright teal inside the rail, where the ordinary one would
  not show
- Colour is never the only signal: icons for categories, words and numbers
  for status
- `prefers-reduced-motion` removes animation outright rather than shortening it
