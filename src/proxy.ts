import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALES, normalizeLocale } from "@/lib/locale";
import type { Locale } from "@/lib/translations";

function getPreferredLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && LOCALES.includes(cookie as Locale)) return normalizeLocale(cookie);

  const accept = req.headers.get("accept-language") || "";
  const preferred = accept
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = Number(params.find((param) => param.trim().startsWith("q="))?.split("=")[1] ?? 1);
      return { locale: tag.substring(0, 2).toLowerCase(), q: Number.isFinite(q) ? q : 0, index };
    })
    .filter(({ locale, q }) => LOCALES.includes(locale as Locale) && q > 0 && q <= 1)
    .sort((a, b) => b.q - a.q || a.index - b.index)[0]?.locale;
  return preferred ? normalizeLocale(preferred) : DEFAULT_LOCALE;
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
