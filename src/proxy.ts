import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["ro", "ru", "en"] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = "ro";

function getPreferredLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && LOCALES.includes(cookie as Locale)) return cookie as Locale;

  const accept = req.headers.get("accept-language") || "";
  for (const part of accept.split(",")) {
    const lang = part.trim().split(";")[0].substring(0, 2).toLowerCase();
    if (LOCALES.includes(lang as Locale)) return lang as Locale;
  }
  return DEFAULT_LOCALE;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API, static files, Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".") // static files (favicon, svg, etc.)
  ) {
    return NextResponse.next();
  }

  // Check if pathname already starts with a locale prefix
  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );

  if (!hasLocale) {
    const locale = getPreferredLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
