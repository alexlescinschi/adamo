import { getCategoryBySlug, getCategoryProducts, getCategories } from "@/lib/crm-api";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { CategoryFilter } from "@/components/category-filter";
import { Suspense } from "react";
import { mapProductCard } from "@/lib/product-mapper";
import { SITE_URL } from "@/app/[locale]/layout";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const PER_PAGE = 24; // ponytail: ca openbox — paginare nativă în CRM
const LOCALES = ["ro", "ru", "en"];

// Parsează filtrele din searchParams: f_{code}=v1,v2 → { code: [v1,v2] }.
function parseFilters(sp: Record<string, string | string[] | undefined>) {
  const attributes: Record<string, string[]> = {};
  for (const [key, raw] of Object.entries(sp)) {
    if (!key.startsWith("f_") || raw == null) continue;
    const code = key.slice(2);
    const vals = (Array.isArray(raw) ? raw : [raw])
      .flatMap((v) => String(v).split(","))
      .map((v) => v.trim())
      .filter(Boolean);
    if (vals.length) attributes[code] = vals;
  }
  return attributes;
}

function productLanguages(slug: string, query: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `${SITE_URL}/${l}/category/${slug}${query}`;
  languages["x-default"] = `${SITE_URL}/ro/category/${slug}${query}`;
  return languages;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const sp = await searchParams;
  const current = Math.max(1, Number(sp.page) || 1);
  const name = await getCategoryBySlug(slug, locale)
    .then((c: any) => c?.name || c?.translation?.name || slug)
    .catch(() => slug);
  const title = `${name}${current > 1 ? ` — pagina ${current}` : ""}`;
  // canonical cu query complet (filtru + pagină) ca să nu canibalizeze SEO între pagini/filtere.
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v == null) continue;
    qs.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const query = qs.toString();
  return {
    title,
    alternates: {
      canonical: `/${locale}/category/${slug}${query ? `?${query}` : ""}`,
      languages: productLanguages(slug, query ? `?${query}` : ""),
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug, locale } = await params;
  const sp = await searchParams;
  const currentPage = Math.max(1, Number(sp.page) || 1);
  const attributes = parseFilters(sp);
  const priceMin = sp.price_min ? Number(sp.price_min) : undefined;
  const priceMax = sp.price_max ? Number(sp.price_max) : undefined;

  // getCategoryBySlug vine cu filterDefinitions (facetări) + categories pentru sidebar.
  const [cat, allCats] = await Promise.all([
    getCategoryBySlug(slug, locale).catch(() => null),
    getCategories(locale).catch(() => null),
  ]);
  const filterDefinitions: any[] = (cat as any)?.filterDefinitions || [];
  const categories: any[] = Array.isArray(allCats)
    ? allCats
    : (allCats as any)?.items || [];

  // ponytail: produsele vin DEJA filtrate + paginate din CRM. Fără enrich.
  let products: any[] = [];
  let totalPages = 1;
  let total = 0;
  try {
    const data: any = await getCategoryProducts(slug, locale, {
      page: currentPage,
      limit: PER_PAGE,
      attributes,
      priceMin: priceMin != null && !Number.isNaN(priceMin) ? priceMin : undefined,
      priceMax: priceMax != null && !Number.isNaN(priceMax) ? priceMax : undefined,
    });
    products = (data?.items || []).map(mapProductCard);
    total = Number(data?.total) || products.length;
    totalPages = Math.max(1, Number(data?.totalPages) || Math.ceil(total / PER_PAGE));
  } catch {
    products = [];
  }

  const categoryName =
    (cat as any)?.name || (cat as any)?.translation?.name || slug;

  // JSON-LD ca openbox: CollectionPage + ItemList + Product/Offer + BreadcrumbList.
  const itemList = products.map((p: any, i: number) => ({
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
        name: categoryName,
        url: `${SITE_URL}/${locale}/category/${slug}`,
        mainEntity: { "@type": "ItemList", numberOfItems: total, itemListElement: itemList },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `${SITE_URL}/${locale}` },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryName,
            item: `${SITE_URL}/${locale}/category/${slug}`,
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
        <Link href="/" className="hover:text-[#1d1d1f] transition-colors">Acasă</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[#1d1d1f]">{categoryName}</span>
      </div>
      <Suspense fallback={null}>
        <CategoryFilter
          products={products}
          categoryName={categoryName}
          perPage={PER_PAGE}
          page={currentPage}
          totalPages={totalPages}
          totalItems={total}
          categorySlug={slug}
          filterDefinitions={filterDefinitions}
          categories={categories}
          activeFilters={attributes}
          activePrice={{ min: priceMin, max: priceMax }}
          serverPaginated
        />
      </Suspense>
    </div>
  );
}
