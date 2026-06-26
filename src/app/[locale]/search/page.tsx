import { SearchResults } from "@/components/search-results";
import { searchProductsAll, getProductById } from "@/lib/crm-api";
import { mapProductCard, extractSpecs } from "@/lib/product-mapper";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams, params }: { searchParams: Promise<{ q?: string }>; params: Promise<{ locale: string }> }) {
  const { q } = await searchParams;
  const { locale } = await params;
  let products: any[] = [];
  if (q) {
    try {
      const data = await searchProductsAll(q, locale);
      const items = data?.items || [];
      const basic = Array.isArray(items) ? items.map(mapProductCard) : [];
      // ponytail: enrich search results for correct specs
      const enriched = await Promise.allSettled(
        basic.map(async (p) => {
          try {
            const detail = await getProductById(p.id, locale);
            const mapped = mapProductCard(detail);
            return { ...p, specs: extractSpecs(detail), images: mapped.images || p.images, price: mapped.price || p.price, badge: mapped.badge, badge_type: mapped.badge_type };
          } catch { return p; }
        })
      );
      products = enriched.map((r) => (r.status === "fulfilled" ? r.value : null)).filter(Boolean);
    } catch {}
  }
  return <SearchResults query={q || ""} products={products} />;
}
