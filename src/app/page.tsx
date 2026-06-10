import { ProductSection } from "@/components/product-section";
import { getPopularProducts, getPromotions, getNewProducts, getPublishedProducts, transformProduct } from "@/lib/crm-api";
import { getCached } from "@/lib/redis";

export const revalidate = 60;

async function fetchSection(
  cacheKey: string,
  fetcher: () => Promise<any>,
  fallbackKey: string,
  fallback: () => Promise<any>
) {
  try {
    const data = await getCached(cacheKey, fetcher, 120);
    const items = data?.items || data || [];
    const products = Array.isArray(items) ? items.map(transformProduct) : [];
    if (products.length > 0) return products;
  } catch {
    // ignore
  }
  try {
    const data = await getCached(fallbackKey, fallback, 120);
    const items = data?.items || data || [];
    return Array.isArray(items) ? items.map(transformProduct) : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const fallbackKey = "published:ro:8";
  const published = () => getPublishedProducts("ro", 8);

  const [popular, promotions, newProducts] = await Promise.all([
    fetchSection("products:popular:ro:8", () => getPopularProducts("ro", 8), fallbackKey, published),
    fetchSection("products:promotions:ro:8", () => getPromotions("ro", 8), fallbackKey, published),
    fetchSection("products:new:ro:8", () => getNewProducts("ro", 8), fallbackKey, published),
  ]);

  return (
    <div className="py-6">
      <ProductSection title="Produse populare" products={popular} />
      <ProductSection title="Promoții" products={promotions} />
      <ProductSection title="Noutăți" products={newProducts} />
    </div>
  );
}
