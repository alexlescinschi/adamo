import { SearchResults } from "@/components/search-results";
import { searchProductsAll } from "@/lib/crm-api";
import { mapProductCard } from "@/lib/product-mapper";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  let products: any[] = [];
  if (q) {
    try {
      const data = await searchProductsAll(q, "ro");
      const items = data?.items || [];
      products = Array.isArray(items) ? items.map(mapProductCard) : [];
    } catch {}
  }
  return <SearchResults query={q || ""} products={products} />;
}
