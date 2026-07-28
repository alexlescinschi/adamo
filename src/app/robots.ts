import type { MetadataRoute } from "next";
import { IS_STAGING, SITE_URL } from "@/lib/site";

// ponytail: robots la root. Permite crawl, blochează rute private/api.
export default function robots(): MetadataRoute.Robots {
  if (IS_STAGING) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          ...["ro", "ru", "en"].flatMap((locale) => [
            `/${locale}/account`,
            `/${locale}/checkout`,
            `/${locale}/cart`,
          ]),
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
