import type { Locale } from "@/lib/translations";

export const LOCALES = ["ro", "ru", "en"] as const;
export const DEFAULT_LOCALE: Locale = "ro";

export function normalizeLocale(value: string | undefined): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

export function localizedPath(localeValue: string | undefined, href: string) {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (href.startsWith("/api/") || href.startsWith("/_next/")) return href;

  const locale = normalizeLocale(localeValue);
  const match = href.match(/^\/(ro|ru|en)(?=\/|\?|#|$)/);
  if (match) return href.replace(/^\/(ro|ru|en)/, `/${locale}`);
  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}

export const INTL_LOCALE: Record<Locale, string> = {
  ro: "ro-RO",
  ru: "ru-RU",
  en: "en-US",
};

export const OPEN_GRAPH_LOCALE: Record<Locale, string> = {
  ro: "ro_MD",
  ru: "ru_RU",
  en: "en_US",
};
