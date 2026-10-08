---
title: "Welcome to Indigo Static"
description: "What this template gives you and where to start."
pubDate: "2026-01-01"
tags: ["meta"]
---

This is a sample post living in the `blog` content collection at
`src/content/blog/`. Delete it and add your own.

## What ships in the box

- **Content collections** with a zod-validated frontmatter schema
- **Type-safe i18n** with locale-prefixed routes (`/`, `/ja/`)
- **Dark mode** with a system/light/dark picker and no flash on load
- **RSS** at `/feed.xml` and a **sitemap** at `/sitemap-index.xml`
- **MDX** support in pages and posts

## Code blocks

Shiki dual themes follow the site theme automatically:

```ts
const greeting: string = "Hello, static world";
console.log(greeting);
```

## Where to start

1. Update `src/consts.ts` with your site's name and description.
2. Set `site` in `astro.config.mjs` to your production URL.
3. Translate the UI strings in `src/translations/`.
4. Replace this post with your own content.
