import {
  getCategoryBySlug,
  getPublishedProducts,
  getPopularProducts,
  getPromotions,
  getNewProducts,
  getProductById,
  mapWithConcurrency,
} from "@/lib/crm-api";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { CategoryFilter } from "@/components/category-filter";
import { Suspense } from "react";
import { mapProductCard } from "@/lib/product-mapper";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const PER_PAGE = 24; // ponytail: ca openbox — mai puține pagini = mai puține SSR-uri
const ENRICH_CONCURRENCY = 4; // ponytail: max 4 request-uri CRM simultan pe enrich

const TITLE_BY_TYPE: Record<string, Record<string, string>> = {
  popular: { ro: "Populare", ru: "Популярные", en: "Popular" },
  promotions: { ro: "Promoții", ru: "Акции", en: "Promotions" },
  new: { ro: "Noutăți", ru: "Новинки", en: "New" },
};

// specMap din listă (gratis, fără apel CRM) → opțiuni consistente pentru sidebar pe toate paginile.
function parseSpecMap(item: any): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof item.cardSpecs === "string") {
    for (const part of item.cardSpecs.split("|")) {
      const [label, ...rest] = part.split(":").map((s: string) => s.trim());
      const value = rest.join(":");
      if (label && value) result[label] = value;
    }
    return result;
  }
  const raw = item.specs || item.shortSpecs || item.attributes || [];
  if (Array.isArray(raw)) {
    for (const s of raw) {
      if (s?.label && s?.valueLabel) result[s.label] = s.valueLabel;
    }
  }
  return result;
}

function extractSpecsObj(detail: any): Record<string, string> {
  const result: Record<string, string> = {};
  const raw = detail?.specs;
  if (!Array.isArray(raw)) return result;
  for (const s of raw) {
    if (s?.label && s?.valueLabel) result[s.label] = s.valueLabel;
  }
  return result;
}

function enrichFromDetail(base: any, detail: any) {
  const price =
    detail?.offerSummary?.minPrice || detail?.minPrice || detail?.price;
  const stock =
    detail?.offerSummary?.inventoryUnitCount ??
    detail?.units_on_warehouse ??
    undefined;
  const mapped = mapProductCard(detail);
  return {
    ...base,
    price: price && (!base.price || base.price === 0) ? price : base.price,
    stock,
    specs: extractSpecsObj(detail),
    badge: mapped.badge,
    badge_type: mapped.badge_type,
  };
}

// ponytail: enrich cu cap de concurență — max ENRICH_CONCURRENCY simultan, nu toate odată.
async function enrichProducts(
  products: any[],
  locale: string
): Promise<any[]> {
  const settled = await mapWithConcurrency(
    products,
    ENRICH_CONCURRENCY,
    async (p) => {
      try {
        const detail = await getProductById(p.id, locale);
        return enrichFromDetail(p, detail);
      } catch {
        return p; // card de bază dacă produsul individual pică
      }
    }
  );
  return settled.map((r) =>
    r.status === "fulfilled" ? r.value : (r as any).reason
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ page?: string; type?: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const { page, type } = await searchParams;
  const current = Math.max(1, Number(page) || 1);
  const suffix = type ? TITLE_BY_TYPE[type]?.[locale] : undefined;
  const pagePart = current > 1 ? ` — pagina ${current}` : "";
  const name = await getCategoryBySlug(slug, locale)
    .then((c) => c?.name || c?.translation?.name || slug)
    .catch(() => slug);
  const title = `${suffix ? suffix + " " : ""}${name}${pagePart}`;
  const query = new URLSearchParams();
  if (type) query.set("type", type);
  if (current > 1) query.set("page", String(current));
  const qs = query.toString();
  return {
    title,
    alternates: {
      // self-referențial (corectează bug-ul openbox: fiecare pagină canonicalizează la sine)
      canonical: `/${locale}/category/${slug}${qs ? `?${qs}` : ""}`,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const { slug, locale } = await params;
  const { page, type } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  // ponytail: try/catch pe apelurile bulk — dacă CRM-ul pică, afișăm "Nu sunt produse", nu 500.
  const cat = await getCategoryBySlug(slug, locale).catch(() => null);
  const categoryId = cat?.id;

  let allItems: any[] = [];
  try {
    let data: any;
    if (type === "popular") data = await getPopularProducts(locale, 200);
    else if (type === "promotions") data = await getPromotions(locale, 200);
    else if (type === "new") data = await getNewProducts(locale, 200);
    else data = await getPublishedProducts(locale, 500);
    allItems = Array.isArray(data) ? data : (data as any)?.items || [];
  } catch {
    allItems = [];
  }

  const items = categoryId
    ? allItems.filter((p: any) => p.category_id === categoryId)
    : allItems;

  // specMap pentru TOATE produsele (0 apel CRM extra) — sidebar consistent între pagini.
  const allBase = items.map((item) => ({
    ...mapProductCard(item),
    specMap: parseSpecMap(item),
  }));

  const start = (currentPage - 1) * PER_PAGE;
  const pageSlice = allBase.slice(start, start + PER_PAGE);
  const enrichedPage = await enrichProducts(pageSlice, locale);

  // Reîmbină pagina enrich-ată în array-ul complet (pentru paginare/filtrare pe client).
  const products = allBase.map((p: any, i: number) => {
    const relIdx = i - start;
    if (relIdx >= 0 && relIdx < enrichedPage.length) return enrichedPage[relIdx];
    return p;
  });

  const categoryName = cat?.name || cat?.translation?.name || slug;
  const suffix = type ? TITLE_BY_TYPE[type]?.[locale] : undefined;
  const displayName = suffix ? `${suffix} ${categoryName}` : categoryName;

  // JSON-LD ca openbox: CollectionPage + ItemList + Product/Offer + BreadcrumbList.
  const itemList = enrichedPage
    .filter((p) => p?.id)
    .map((p: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.name,
        url: `/${locale}/product/${p.id}`,
        ...(p.image_url ? { image: p.image_url } : {}),
        offers: {
          "@type": "Offer",
          priceCurrency: "MDL",
          price: p.price || 0,
          availability:
            p.stock && p.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
      },
    }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: displayName,
        url: `/${locale}/category/${slug}`,
        itemListElement: itemList.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `/${locale}/product/${it.item.url.split("/").pop()}`,
        })),
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: items.length,
          itemListElement: itemList,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Acasă",
            item: `/${locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: displayName,
            item: `/${locale}/category/${slug}`,
          },
        ],
      },
    ],
  };

  return (
    <div className="py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex items-center gap-2 text-sm text-[#6b6c6c] mb-4">
        <Link href="/" className="hover:text-[#1d1d1f] transition-colors">
          Acasă
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[#1d1d1f]">{displayName}</span>
      </div>
      <Suspense fallback={null}>
        <CategoryFilter
          products={products}
          categoryName={displayName}
          page={currentPage}
          perPage={PER_PAGE}
          totalItems={items.length}
        />
      </Suspense>
    </div>
  );
}
