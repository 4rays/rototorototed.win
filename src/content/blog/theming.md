---
title: "Theming with Semantic Tokens"
description: "How the color system works and how to make it yours."
pubDate: "2026-01-02"
tags: ["theming", "tailwind"]
---

All theme variables live in `src/styles.css`. Components use **semantic
tokens** — never raw palette colors:

```html
<!-- ✅ Use semantic tokens -->
<div class="bg-card text-card-foreground border-border rounded-lg border">
  <p class="text-muted-foreground">Subtle text</p>
</div>

<!-- ❌ Don't hardcode palette colors -->
<div class="bg-seagull-100 text-seagull-900">…</div>
```

## Making it yours

The template ships four palettes: `seagull` (neutral), `hyacinth` (primary),
`asparagus` (secondary), and `earth` (accent). To rebrand:

1. Pick new palette names that evoke your brand.
2. Find-and-replace the names in `src/styles.css`.
3. Adjust the OKLCH values — the [OKLCH color picker](https://oklch.com/)
   helps.

Dark mode overrides live in the `.dark` block of the same file.
