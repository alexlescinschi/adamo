import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALES, normalizeLocale } from "@/lib/locale";
import type { Locale } from "@/lib/translations";

// ponytail: SEO — nu mai deducem limba din Accept-Language. Crawlerele nu
// trimit un header consistent, deci varianta implicită a site-ului trebuie
// să fie mereu aceeași (RO). Limba se schimbă manual, din UI.
function getPreferredLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && LOCALES.includes(cookie as Locale)) return normalizeLocale(cookie);
  return DEFAULT_LOCALE;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API, static files, Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    /\.(?:avif|css|eot|gif|ico|jpe?g|js|map|pdf|png|svg|ttf|txt|webp|woff2?|xml)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check if pathname already starts with a locale prefix
  const pathLocale = LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));

  if (!pathLocale) {
    const locale = getPreferredLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  if (req.cookies.get("NEXT_LOCALE")?.value !== pathLocale) {
    response.cookies.set("NEXT_LOCALE", pathLocale, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
