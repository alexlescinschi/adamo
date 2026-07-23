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
        disallow: ["/api/", "/account/", "/checkout", "/cart"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
