---
name: theming
description: This skill should be used when the user asks to "change the color scheme", "add a brand color", "customize the theme", "rename the color palette", "update styles.css", "generate a new theme", "add OKLCH colors", "update semantic tokens", or works with visual theming in this project.
---

# Theming

This project uses a CSS custom property theming system built on Tailwind CSS 4.
The site is **dark-only** — a single palette derived from the Rototo game's
start screen. There is no light mode, no theme switcher, and no `.dark` class.
All theme variables live in `src/styles.css`.

## File Structure

```
src/
├── styles.css              # All theme variables (edit this)
├── scripts/
│   └── start-background.ts # Fixed canvas backdrop (the game scene)
└── components/
    └── StartBackground.astro # Mounts the canvas behind page content
```

## `src/styles.css` Sections

### `:root` — The (only) theme

```css
:root {
  color-scheme: dark;
  --radius: 0.625rem;
  --font-sans: var(--font-inter);
  --font-display: var(--font-bungee);
  --background: var(--color-void-950);
  --foreground: var(--color-void-100);
  --primary: var(--color-pulse-400);
  /* ... */
}
```

### `@theme inline` — Color palette

Defines the raw color palettes in OKLCH. These are referenced by the semantic
tokens above and generate Tailwind utilities (`bg-pulse-400`, …).

## Palettes

The palette anchors come from the game project (`../rototo-rotoded`):

| Palette  | Role              | Anchor                                                  |
| -------- | ----------------- | ------------------------------------------------------- |
| `void`   | Deep-space purple | `background.tscn` BaseColor `Color(0.1, 0.05, 0.2)`     |
| `beam`   | Neon cyan         | `warp_streaks.gdshader` `color_a` `(0.2, 0.9, 1.0)`     |
| `pulse`  | Neon magenta      | `warp_streaks.gdshader` `color_b` `(1.0, 0.25, 0.85)`   |
| `nebula` | UI purple         | `game_start.tscn` SettingsButton `Color(0.4, 0.2, 0.6)` |

## Semantic Tokens

Always use semantic tokens in components — never raw palette colors:

| Token                                        | Used for                                       |
| -------------------------------------------- | ---------------------------------------------- |
| `--background` / `--foreground`              | Page background and body text                  |
| `--card` / `--card-foreground`               | Card surfaces and their text                   |
| `--primary` / `--primary-foreground`         | Primary actions (buttons, links)               |
| `--secondary` / `--secondary-foreground`     | Secondary actions                              |
| `--muted` / `--muted-foreground`             | Subtle backgrounds and muted text              |
| `--accent` / `--accent-foreground`           | Accent highlights                              |
| `--destructive` / `--destructive-foreground` | Errors and danger states                       |
| `--border`                                   | Border colors                                  |
| `--input`                                    | Form input backgrounds                         |
| `--ring`                                     | Focus ring colors                              |
| `--scene` / `--scene-foreground`             | Text sitting directly on the canvas game scene |

In Tailwind these become: `bg-background`, `text-foreground`, `bg-primary`,
`text-primary-foreground`, `border-border`, etc.

The `scene` tokens exist because the landing page paints the always-dark game
scene on a fixed canvas behind the content. Text over that canvas uses
`text-scene-foreground`; shared chrome (blog, about) sits on `bg-background`
surfaces and uses the regular tokens.

## Customizing Colors

### Change existing palette colors

Edit OKLCH values in the `@theme inline` section of `src/styles.css`:

```css
--color-pulse-500: oklch(0.6656 0.262 337.56);
```

Use the [OKLCH color picker](https://oklch.com/) to find values for a desired
color.

### Add a brand color palette

1. Define the full palette (shades: 10, 20, 50–950) in `@theme inline`:

```css
--color-brand-50: oklch(0.95 0.02 240);
--color-brand-100: oklch(0.9 0.04 240);
/* ... through 950 */
--color-brand-500: oklch(0.65 0.15 240);
--color-brand-900: oklch(0.35 0.12 240);
--color-brand-950: oklch(0.2 0.08 240);
```

2. Map to semantic tokens in `:root`:

```css
:root {
  --primary: var(--color-brand-500);
  --primary-foreground: var(--color-brand-50);
}
```

### Rename the default palettes

The site ships four palettes: `void` (deep purple surface), `pulse` (primary
magenta), `beam` (cyan accent), and `nebula` (purple). When rebranding:

1. Choose new names — evocative, brand-connected names work best.
2. Find-and-replace the palette name throughout `src/styles.css`.
3. Update any component code that directly references the palette name (rare —
   most code uses semantic tokens).

[Kromatic](https://kromatic.app) is useful for generating meaningful color
names from a hex value.

## Change border radius

Modify `--radius` in `:root`. Variants (`--radius-sm`, `--radius-md`,
`--radius-lg`, `--radius-xl`) are computed from this base value automatically.

## Typography

Fonts are self-hosted through [Astro's fonts API](https://docs.astro.build/en/guides/fonts/):
font files are read from local sources at build time and emitted into `dist/` —
no font CDN, no runtime dependency.

- **Bungee** (`src/fonts/bungee.ttf`, from the game's `assets/`) is the display
  face for headings and buttons: `--font-display` → the `font-display` utility
  and the `.btn-arcade` class.
- **Inter** (variable, latin subset, from `@fontsource-variable/inter`) is the
  body face: `--font-sans`.
- Japanese text deliberately stays on the platform gothic stack, since neither
  face has CJK coverage.

Three places are involved:

1. The `fonts` entry in `astro.config.mjs` — declares each family, its CSS
   variable (`--font-bungee`, `--font-inter`), and the font file(s) it reads.
   `src` paths resolve as package imports or project-relative files. Keep the
   local provider: the Google provider fetches from `fonts.googleapis.com` at
   build time, which would put a third-party network call on the build.
2. `<Font cssVariable="…" preload />` in the `<head>` of `BaseLayout.astro` —
   the config alone emits nothing; this component produces the `@font-face`
   rules and the preload links.
3. `--font-sans` / `--font-display` re-exported in the `@theme inline` block of
   `src/styles.css` — points Tailwind's `font-sans` / `font-display` utilities
   at the generated variables.

Leave `fallbacks` at their defaults and `optimizedFallbacks` on, so Astro emits
a metric-matched system fallback and text doesn't reflow when the webfont
arrives.

## Using Tokens in Components

```html
<!-- ✅ Use semantic tokens -->
<div class="bg-background text-foreground">
  <button class="bg-primary text-primary-foreground">Submit</button>
  <div class="bg-card text-card-foreground border-border rounded-lg border">
    Card content
  </div>
  <p class="text-muted-foreground">Subtle text</p>
</div>

<!-- ❌ Don't hardcode palette colors -->
<button class="bg-pulse-400 text-white">Submit</button>
```
