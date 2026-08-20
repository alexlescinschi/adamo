import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/crm-api";
import { getPublishedContentSlugs } from "@/lib/sanity";
import { SITE_URL } from "@/lib/site";

// ponytail: sitemap la root (acoperă toate locale-urile). Generate, cached de Next.
const LOCALES = ["ro", "ru", "en"];

// Endpoint public, folosit deja în generateStaticParams.
async function getProductIds(): Promise<{ ids: number[]; slugs: string[] }> {
  try {
    const res = await fetch("https://api.crm.adamo.md/v1/ecommerce/products/ids?locale=ro", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { ids: [], slugs: [] };
    const data = await res.json();
    return { ids: data.ids || [], slugs: data.slugs || [] };
  } catch {
    return { ids: [], slugs: [] };
  }
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

  // Produse per locale
  const { ids, slugs } = await getProductIds();
  for (const l of LOCALES) {
    ids.forEach((id, i) => {
      const slugPart = slugs[i] ? `${id}-${slugs[i]}` : String(id);
      entries.push({
        url: `${SITE_URL}/${l}/product/${slugPart}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    });
  }

  return entries;
}
