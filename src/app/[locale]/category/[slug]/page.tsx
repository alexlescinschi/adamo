import { getCategoryBySlug, getPublishedProducts, getProductById } from "@/lib/crm-api";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { CategoryFilter } from "@/components/category-filter";
import { Suspense } from "react";
import { mapProductCard } from "@/lib/product-mapper";

export const dynamic = "force-dynamic";

function enrichFromDetail(base: any, detail: any) {
  const price = detail?.offerSummary?.minPrice || detail?.minPrice || detail?.price;
  const stock = detail?.offerSummary?.inventoryUnitCount ?? detail?.units_on_warehouse ?? undefined;
  const mapped = mapProductCard(detail);
  return {
    ...base,
    price: (price && (!base.price || base.price === 0)) ? price : base.price,
    stock,
    specs: mapped.specs,
    badge: mapped.badge,
    badge_type: mapped.badge_type,
  };
}

async function enrichProducts(products: any[], locale: string): Promise<any[]> {
  const enriched = await Promise.allSettled(
    products.map(async (p) => {
      try {
        const detail = await getProductById(p.id, locale);
        return enrichFromDetail(p, detail);
      } catch {
        return p;
      }
    })
  );
  return enriched.map((r) => (r.status === "fulfilled" ? r.value : r.reason));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const PER_PAGE = 8;

  const [cat, allProductsData] = await Promise.all([
    getCategoryBySlug(slug, locale),
    getPublishedProducts(locale, 500),
  ]);
  const categoryId = cat?.id;
  const allItems = Array.isArray(allProductsData) ? allProductsData : (allProductsData as any)?.items || [];
  const items = categoryId ? allItems.filter((p: any) => p.category_id === categoryId) : allItems;
  const products = await enrichProducts(items.map(mapProductCard), locale);
  const categoryName = cat?.name || cat?.translation?.name || slug;

  return (
    <div className="py-6">
      <div className="flex items-center gap-2 text-sm text-[#6b6c6c] mb-4">
        <Link href="/" className="hover:text-[#1d1d1f] transition-colors">Acasă</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[#1d1d1f]">{categoryName}</span>
      </div>
      <Suspense fallback={null}>
        <CategoryFilter products={products} categoryName={categoryName} page={1} perPage={PER_PAGE} />
      </Suspense>
    </div>
  );
}
