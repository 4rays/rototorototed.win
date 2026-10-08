import {defaultLocale, locales, translations, type Locale} from "./constants";

export function getLocaleFromParams(
  params: Record<string, string | undefined>
): Locale {
  const lang = params.lang;
  return lang && locales.includes(lang as Locale)
    ? (lang as Locale)
    : defaultLocale;
}

export function useTranslationsFromParams(
  params: Record<string, string | undefined>
) {
  const locale = getLocaleFromParams(params);
  return useTranslations(locale);
}

export function getLocaleFromUrl(url: string) {
  const segments = url.split("/").filter(Boolean);
  if (segments.length === 0) return defaultLocale;

  const locale = segments[0] as Locale;
  if (!locales.includes(locale)) return defaultLocale;
  return locale;
}

export function useTranslations(locale?: Locale) {
  return translations[locale || defaultLocale];
}

export function localizeUrl(path: string, locale?: Locale): string {
  const safeLocale =
    locale && locales.includes(locale as Locale)
      ? (locale as Locale)
      : defaultLocale;

  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;

  if (!cleanPath) {
    // If it's just the root path
    return safeLocale === defaultLocale ? "/" : `/${safeLocale}/`;
  }

  // Check if path already has a locale prefix
  const segments = cleanPath.split("/");
  if (locales.includes(segments[0] as Locale)) {
    // Replace existing locale with new one
    segments[0] = safeLocale;
    return `/${segments.join("/")}`;
  }

  // The default locale lives at the root, other locales under a prefix
  return safeLocale === defaultLocale
    ? `/${cleanPath}`
    : `/${safeLocale}/${cleanPath}`;
}

// getStaticPaths helper for [...lang] routes: the default locale renders at
// the unprefixed path, every other locale under its prefix.
export function getLocaleStaticPaths() {
  return [
    {params: {lang: undefined}},
    ...locales
      .filter((locale) => locale !== defaultLocale)
      .map((locale) => ({params: {lang: locale}}))
  ];
}

// Sets the language preference cookie (client-side)
export function setLanguageCookie(locale: Locale) {
  document.cookie = `preferred_lang=${locale};path=/;max-age=31536000;SameSite=Lax;Secure`;
}

// Gets the language preference from cookies (client-side)
export function getLanguageCookieValue(): Locale | null {
  const match = document.cookie.match(/(^|;)\s*preferred_lang=([^;]+)/);
  const cookieValue = match ? match[2] : null;
  return cookieValue && locales.includes(cookieValue as Locale)
    ? (cookieValue as Locale)
    : null;
}

// Get browser language that matches our supported locales (client-side)
export function getBrowserLanguage(): Locale | null {
  if (typeof navigator === "undefined") return null;

  // Try to match navigator.languages array first (more specific)
  if (navigator.languages && navigator.languages.length) {
    for (const lang of navigator.languages) {
      const browserLang = lang.split("-")[0]; // Get base language code (e.g., 'en' from 'en-US')
      if (locales.includes(browserLang as Locale)) {
        return browserLang as Locale;
      }
    }
  }

  // Fall back to navigator.language
  if (navigator.language) {
    const browserLang = navigator.language.split("-")[0];
    if (locales.includes(browserLang as Locale)) {
      return browserLang as Locale;
    }
  }

  return null;
}

// Get the preferred language using the fallback chain (client-side):
// cookie > browser language > default
export function getPreferredLanguage(): Locale {
  const cookieLang = getLanguageCookieValue();
  if (cookieLang) return cookieLang;

  const browserLang = getBrowserLanguage();
  if (browserLang) return browserLang;

  return defaultLocale;
}
