import type { MetadataRoute } from "next";

// ponytail: robots la root. Permite crawl, blochează rute private/api.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/account/", "/checkout", "/cart"],
      },
    ],
    sitemap: "https://adamo3.vercel.app/sitemap.xml",
    host: "https://adamo3.vercel.app",
  };
}
