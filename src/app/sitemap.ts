import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/crm-api";
import { getPublishedContentSlugs } from "@/lib/sanity";
import { SITE_URL } from "@/lib/site";

// ponytail: sitemap la root (acoperă toate locale-urile). Generate, cached de Next.
const LOCALES = ["ro", "ru", "en"];

// Endpoint public, folosit deja în generateStaticParams.
async function getProductIds(): Promise<number[]> {
  try {
    const res = await fetch("https://api.crm.adamo.md/v1/ecommerce/products/ids?locale=ro", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.ids || [];
  } catch {
    return [];
  }
}

async function getProductUrls(ids: number[]): Promise<string[]> {
  const urls: string[] = [];
  const jobs = LOCALES.flatMap((locale) => ids.map((id) => ({ id, locale })));

  // Canonical metadata uses the product-detail slug, not the abbreviated ids-feed slug.
  for (let index = 0; index < jobs.length; index += 20) {
    const batch = await Promise.all(jobs.slice(index, index + 20).map(async ({ id, locale }) => {
      try {
        const res = await fetch(`https://api.crm.adamo.md/v1/ecommerce/products/${id}?locale=${locale}`, {
          next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        const product = await res.json();
        return product.slug ? `${SITE_URL}/${locale}/product/${id}-${product.slug}` : null;
      } catch {
        return null;
      }
    }));
    urls.push(...batch.filter((url): url is string => Boolean(url)));
  }

  return urls;
}

async function getCategorySlugs(): Promise<string[]> {
  try {
    const data = await getCategories("ro");
    const arr = Array.isArray(data) ? data : data?.items || [];
    return arr.map((c: any) => c.slug || c.storefrontPathSlug).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  const content = await getPublishedContentSlugs();

  // Home + pagini statice per locale
  for (const l of LOCALES) {
    entries.push({ url: `${SITE_URL}/${l}`, lastModified: now, changeFrequency: "daily", priority: 1 });
    for (const p of ["/contact", "/blog", "/harta-site-ului"]) {
      entries.push({ url: `${SITE_URL}/${l}${p}`, lastModified: now, changeFrequency: "monthly", priority: 0.3 });
    }
    for (const page of content.pages.filter((item) => item.slug !== "contact")) {
      entries.push({ url: `${SITE_URL}/${l}/${page.slug}`, lastModified: new Date(page.updatedAt), changeFrequency: "monthly", priority: 0.5 });
    }
    for (const post of content.posts) {
      entries.push({ url: `${SITE_URL}/${l}/blog/${post.slug}`, lastModified: new Date(post.updatedAt), changeFrequency: "monthly", priority: 0.5 });
    }
  }

  // Pagini categorie per locale
  const categorySlugs = await getCategorySlugs();
  for (const l of LOCALES) {
    for (const slug of categorySlugs) {
      entries.push({
        url: `${SITE_URL}/${l}/category/${slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  // Produse: sitemapul trebuie să emită exact URL-ul canonical al paginii.
  for (const url of await getProductUrls(await getProductIds())) {
    entries.push({
      url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
