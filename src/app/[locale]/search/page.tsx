import { Suspense } from "react";
import { CategoryFilter, type FilterDefinition } from "@/components/category-filter";
import { getCategories, getProductById, searchProductsAll } from "@/lib/crm-api";
import { hasAttribute, mapProductCard } from "@/lib/product-mapper";
import { getDict } from "@/lib/translations";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

function parseFilters(searchParams: Record<string, string | string[] | undefined>) {
  const filters: Record<string, string[]> = {};
  for (const [key, raw] of Object.entries(searchParams)) {
    if (!key.startsWith("f_") || raw == null) continue;
    const values = (Array.isArray(raw) ? raw : [raw]).flatMap((value) => value.split(",")).filter(Boolean);
    if (values.length) filters[key.slice(2)] = values;
  }
  return filters;
}

export default async function SearchPage({
  searchParams,
  params,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{ locale: string }>;
}) {
  const [sp, { locale }] = await Promise.all([searchParams, params]);
  const tr = getDict(locale);
  const query = String(Array.isArray(sp.q) ? sp.q[0] : sp.q || "").trim();

  if (!query) {
    return <div className="py-12 text-center text-[#6b6c6c]">{tr.search.noResultsSub}</div>;
  }

  const [searchData, categoryData] = await Promise.all([
    searchProductsAll(query, locale).catch(() => ({ items: [] })),
    getCategories(locale).catch(() => []),
  ]);
  const items = Array.isArray(searchData?.items) ? searchData.items : [];
  const details = await Promise.allSettled(items.map((item: any) => getProductById(item.id, locale)));
  const entries = items.map((item: any, index: number) => {
    const source = details[index]?.status === "fulfilled" ? { ...item, ...details[index].value } : item;
    return { source, card: mapProductCard(source) };
  });

  const facets = new Map<string, { label: string; options: Map<string, string> }>();
  for (const { source } of entries) {
    for (const spec of Array.isArray(source.specs) ? source.specs : []) {
      const value = spec.filterLink?.value;
      if (!spec.code || !spec.label || !spec.valueLabel || !value) continue;
      if (!facets.has(spec.code)) facets.set(spec.code, { label: spec.label, options: new Map() });
      facets.get(spec.code)!.options.set(String(value), spec.valueLabel);
    }
  }
  const filterDefinitions: FilterDefinition[] = [...facets].map(([code, facet]) => ({
    code,
    label: facet.label,
    options: [...facet.options].map(([value, label]) => ({ value, label })),
  }));

  const activeFilters = parseFilters(sp);
  const priceMin = sp.price_min ? Number(sp.price_min) : undefined;
  const priceMax = sp.price_max ? Number(sp.price_max) : undefined;
  const sort = ["newest", "price_asc", "price_desc", "popular", "discount"].includes(String(sp.sort)) ? String(sp.sort) : "newest";
  const filtered = entries.filter(({ source, card }) => {
    const specs = Array.isArray(source.specs) ? source.specs : [];
    const matchesFacets = Object.entries(activeFilters).every(([code, selected]) => {
      const values = specs.filter((spec: any) => spec.code === code).map((spec: any) => String(spec.filterLink?.value || ""));
      return selected.some((value) => values.includes(value));
    });
    return matchesFacets &&
      (priceMin == null || Number.isNaN(priceMin) || card.price >= priceMin) &&
      (priceMax == null || Number.isNaN(priceMax) || card.price <= priceMax) &&
      (sort !== "discount" || (card.old_price && card.old_price > card.price));
  });
  filtered.sort((a, b) => {
    if (sort === "price_asc") return a.card.price - b.card.price;
    if (sort === "price_desc") return b.card.price - a.card.price;
    if (sort === "popular") return Number(hasAttribute(b.source, "popular")) - Number(hasAttribute(a.source, "popular"));
    return Number(b.card.id) - Number(a.card.id);
  });

  const rawCategories: any[] = Array.isArray(categoryData) ? categoryData : (categoryData as any)?.items || [];
  const categories = rawCategories.map((category: any) => ({
    slug: category.storefrontPathSlug || category.slug,
    name: category.name || category.translation?.name || category.slug,
  }));
  const products = filtered.map(({ card }) => card);

  return (
    <div className="py-6">
      <Suspense fallback={null}>
        <CategoryFilter
          products={products}
          categoryName={`${tr.search.resultsFor} "${query}"`}
          page={Math.max(1, Number(sp.page) || 1)}
          perPage={PER_PAGE}
          totalItems={products.length}
          categorySlug="search"
          filterDefinitions={filterDefinitions}
          categories={categories}
          activeFilters={activeFilters}
          activePrice={{ min: priceMin, max: priceMax }}
          showAbout={false}
        />
      </Suspense>
    </div>
  );
}
