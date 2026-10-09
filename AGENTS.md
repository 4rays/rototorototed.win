# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Project Overview

rototorototed.win is the **landing page for Rototo**, based on the [indigo-static](https://github.com/indigo-ce/indigo-static) template. It produces plain HTML (`output: "static"`, no adapter, no server, no secrets) deployable to any static host.

## Development Commands

Commands marked with **(CI)** run in the `Test` workflow on every pull request.

- `pnpm dev` - Start dev server at localhost:4321
- `pnpm build` - Build the static site to `./dist/` (CI)
- `pnpm preview` - Build, then preview the production output locally
- `pnpm check` - Run Astro/TypeScript diagnostics (CI)
- `pnpm format` - Format all files with Prettier
- `pnpm format:check` - Verify Prettier formatting without writing (CI)

## Architecture

### Static-Only

- No adapter, no SSR, no middleware, no API routes. Everything is prerendered at build time.
- Language preference redirect is necessarily **client-side** (`src/scripts/language-detection.js`) since static hosts can't inspect `Accept-Language`.
- Deployed with Cloudflare Workers Builds (`pnpm run build`, then `npx wrangler deploy`) as static assets only; `wrangler.jsonc` points at `./dist`. Keep that file: without it wrangler's autoconfig runs `astro add cloudflare` and adds an adapter. `workerd` must stay in `allowBuilds` in `pnpm-workspace.yaml`.

### i18n

- Locales: `en` (default, unprefixed paths) and `ja` (prefixed `/ja/`).
- Localized pages live in `src/pages/[...lang]/` and must export `getStaticPaths` returning `getLocaleStaticPaths()` from `src/i18n/utils.ts`.
- Translations are JSON files in `src/translations/`; the `Translations` type is inferred from `en.json`, so a missing key in usage is a compile error.
- Use `localizeUrl()` for every internal link — never hardcode `/ja/`.
- The blog and RSS feed are default-locale-only by design; see `skills/i18n/SKILL.md` for how to localize them later.

### Content

- Blog posts are a content collection (`src/content/blog/`) with a zod schema in `src/content.config.ts`. Support both `.md` and `.mdx`.
- RSS feed: `src/pages/feed.xml.ts` renders post bodies through markdown-it and sanitizes the HTML.
- Sitemap is automatic via `@astrojs/sitemap` — keep `site` in `astro.config.mjs` accurate.

### Theming

- All theme variables live in `src/styles.css` (Tailwind CSS 4, CSS custom properties). The site is **dark-only**: a single palette derived from the Rototo game (`void`, `beam`, `pulse`, `nebula` in `@theme inline`). No light mode, no theme switcher, no `.dark` class.
- Components must use **semantic tokens** (`bg-background`, `text-muted-foreground`, …), never raw palette colors (`bg-pulse-400`).
- Every page renders the game's start-screen scene on a fixed canvas (`src/scripts/start-background.ts`, mounted by `StartBackground.astro` in `BaseLayout.astro`); text sitting directly on that scene uses the `scene`/`scene-foreground` tokens, not `foreground`. The body background is `bg-scene-tint` (the scene's dominant purple, mirrored in the `theme-color` meta) because Safari 26 tints its toolbars from it.
- Fonts are self-hosted via Astro's fonts API (`fonts` in `astro.config.mjs` + `<Font>` in `BaseLayout.astro`); do not add font CDN links. Bungee is the display face (`--font-display`), Inter the body face.

### SEO

- `BaseLayout.astro` handles canonical URLs, Open Graph, Twitter cards, RSS link, sitemap link.
- Default social card: `/social-cards/default.jpg` (add one when branding a new site).

## Repository Skills

Procedural guides live in `skills/` as `SKILL.md` files. They are named in no other document, so check them before improvising a procedure:

- `skills/theming/SKILL.md` - The theming system: palettes, semantic tokens, typography, rebranding
- `skills/i18n/SKILL.md` - Translation files, localized pages, locale-aware URLs, adding keys or a new language

## Conventions

- pnpm only. Node >= 22.13.0.
- Import alias: `@/*` maps to `src/*`.
- Prettier config: 2 spaces, no bracket spacing, no trailing commas (`bracketSpacing: false`, `trailingComma: "none"`).
