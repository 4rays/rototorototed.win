---
name: i18n
description: This skill should be used when the user asks to "add a new language", "add translations", "add a translation key", "use translations in a page", "set up i18n", "add French support", "localize a page", "switch language", "get the current locale", "create a locale-aware URL", or works with internationalization in this project.
---

# Internationalization (i18n)

This project implements i18n using dynamic Astro routes with type-safe translations. Pages live under a `[...lang]` route and render once per locale via `getStaticPaths()`. No page duplication per language.

Supported locales: `en` (default), `ja`. The default locale is unprefixed (`/about`); other locales are prefixed (`/ja/about`).

## File Structure

```
src/
├── translations/
│   ├── en.json          # English strings
│   └── ja.json          # Japanese strings
├── i18n/
│   ├── constants.ts     # Locale list, Locale type, translations map
│   └── utils.ts         # Helper functions
├── scripts/
│   └── language-detection.js  # Client-side root redirect (cookie > browser)
└── pages/
    └── [...lang]/       # Localized pages live here
```

## Adding a Localized Page

Create a page under `src/pages/[...lang]/` and return `getLocaleStaticPaths()` from `getStaticPaths`:

```astro
---
import {
  getLocaleFromParams,
  getLocaleStaticPaths,
  useTranslations
} from "@/i18n/utils";

export function getStaticPaths() {
  return getLocaleStaticPaths();
}

const locale = getLocaleFromParams(Astro.params);
const t = useTranslations(locale);
---

<PageLayout title={t.about.title} locale={locale}>
  <h1>{t.about.title}</h1>
</PageLayout>
```

This generates `/about` (default locale) and `/ja/about`.

## Locale-Aware URLs

Use `localizeUrl` to build links that preserve the current locale:

```astro
---
import {localizeUrl} from "@/i18n/utils";

const aboutUrl = localizeUrl("/about", locale);
---

<a href={aboutUrl}>About</a>
```

Never hardcode `/ja/` — always use `localizeUrl`. The default locale is unprefixed, so `localizeUrl("/about", "en")` returns `/about`.

## Adding Translation Keys

Add to both `src/translations/en.json` and `src/translations/ja.json`:

```json
// en.json
{
  "nav": {
    "home": "Home",
    "settings": "Settings"
  }
}

// ja.json
{
  "nav": {
    "home": "ホーム",
    "settings": "設定"
  }
}
```

The `Translations` type is inferred from the English file — TypeScript will error if a key exists in `en.json` but is missing or mistyped in usage.

## Adding a New Language

Four steps:

**1. Create the translation file**

`src/translations/fr.json` — copy structure from `en.json`, translate all values.

**2. Update `src/i18n/constants.ts`**

```typescript
import frTranslations from "@/translations/fr.json";

export const locales = ["en", "ja", "fr"] as const;
export type Locale = (typeof locales)[number];

export const translations: Record<Locale, Translations> = {
  en: enTranslations,
  ja: jaTranslations,
  fr: frTranslations
};

export const localeNames: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  fr: "Français"
};
```

**3. That's it for routing** — `getLocaleStaticPaths()` derives from `locales`, so every `[...lang]` page picks up `/fr/` automatically.

**4. Check the `LanguagePicker`** — it iterates `locales`, so no change needed there either.

## Root-Path Language Redirect

Static hosting can't inspect `Accept-Language` server-side, so `src/scripts/language-detection.js` (loaded by `BaseLayout.astro`) redirects `/` to the visitor's preferred locale client-side: cookie first, then browser language. The preference cookie is also written by the `LanguagePicker` when a visitor switches language manually.

## Non-Localized Routes

Not everything needs a locale. The blog (`src/pages/blog/`) and RSS feed are default-locale-only in this template — put routes outside `[...lang]` when translation adds no value. To localize the blog later, key the collection folder by locale (`src/content/blog/ja/*.md`) and filter by locale in the index page.
