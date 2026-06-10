import { ProductSection } from "@/components/product-section";
import { getPopularProducts, getPromotions, getNewProducts, getPublishedProducts } from "@/lib/crm-api";

export const revalidate = 60;

function transformProduct(item: any) {
  const price = item.offerSummary?.minPrice || item.minPrice || item.price || 0;
  const oldPrice = item.discount?.originalPrice || item.oldPrice || item.old_price;
  return {
    id: item.id,
    name: item.storefrontName || item.name,
    slug: item.slug,
    price,
    old_price: oldPrice > price ? oldPrice : undefined,
    image_url: item.imageUrl || item.previewImageUrl || null,
    unit_id: item.id,
  };
}

async function fetchSection(fetcher: () => Promise<any>, fallback: () => Promise<any>) {
  try {
    const data = await fetcher();
    const items = data?.items || data || [];
    const products = Array.isArray(items) ? items.map(transformProduct) : [];
    if (products.length > 0) return products;
  } catch {
    // ignore
  }
  try {
    const data = await fallback();
    const items = data?.items || data || [];
    return Array.isArray(items) ? items.map(transformProduct) : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const published = () => getPublishedProducts("ro", 8);

  const [popular, promotions, newProducts] = await Promise.all([
    fetchSection(() => getPopularProducts("ro", 8), published),
    fetchSection(() => getPromotions("ro", 8), published),
    fetchSection(() => getNewProducts("ro", 8), published),
  ]);

  return (
    <div className="py-6">
      <ProductSection title="Produse populare" products={popular} />
      <ProductSection title="Promoții" products={promotions} />
      <ProductSection title="Noutăți" products={newProducts} />
    </div>
  );
}
