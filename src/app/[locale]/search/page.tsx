import { SearchResults } from "@/components/search-results";
import { searchProductsAll } from "@/lib/crm-api";
import { mapProductCard } from "@/lib/product-mapper";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams, params }: { searchParams: Promise<{ q?: string }>; params: Promise<{ locale: string }> }) {
  const { q } = await searchParams;
  const { locale } = await params;
  let products: any[] = [];
  if (q) {
    try {
      const data = await searchProductsAll(q, locale);
      const items = data?.items || [];
      products = Array.isArray(items) ? items.map(mapProductCard) : [];
    } catch {}
  }
  return <SearchResults query={q || ""} products={products} />;
}
