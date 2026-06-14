import { getCategoryBySlug, getPublishedProducts, getProductById } from "@/lib/crm-api";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { CategoryFilter } from "@/components/category-filter";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const SLUG = "laptops";

function extractBase(item: any) {
  return {
    id: item.id,
    name: item.storefrontName || item.name,
    slug: item.slug,
    price: item.offerSummary?.minPrice || item.minPrice || item.price || 0,
    image_url: item.imageUrl || item.previewImageUrl || null,
    unit_id: item.id,
    stock: 0,
  };
}

function extractSpecs(data: any): Record<string, string> {
  if (!data?.specs || !Array.isArray(data.specs)) return {};
  const result: Record<string, string> = {};
  for (const spec of data.specs) {
    if (spec.label && spec.valueLabel) result[spec.label] = spec.valueLabel;
  }
  return result;
}

function enrichPrice(base: any, detail: any) {
  const fromDetail = detail?.offerSummary?.minPrice || detail?.minPrice || detail?.price;
  if (fromDetail && (!base.price || base.price === 0)) return fromDetail;
  return base.price;
}

function enrichStock(detail: any) {
  return detail?.offerSummary?.inventoryUnitCount || detail?.units_on_warehouse || 0;
}

async function enrichWithSpecs(products: any[], locale: string) {
  const enriched = await Promise.allSettled(
    products.map(async (p) => {
      try {
        const detail = await getProductById(p.id, locale);
        return { ...p, price: enrichPrice(p, detail), stock: enrichStock(detail), specs: extractSpecs(detail) };
      } catch {
        return { ...p, specs: {} };
      }
    })
  );
  return enriched.map((r) => (r.status === "fulfilled" ? r.value : { ...r.reason, specs: {} }));
}

export default async function LaptopuriPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const PER_PAGE = 8;

  const [cat, allProductsData] = await Promise.all([
    getCategoryBySlug(SLUG, locale),
    getPublishedProducts(locale, 500),
  ]);
  const categoryId = cat?.id;
  const allItems = Array.isArray(allProductsData) ? allProductsData : (allProductsData as any)?.items || [];
  const items = categoryId ? allItems.filter((p: any) => p.category_id === categoryId) : allItems;
  const products = await enrichWithSpecs(items.map(extractBase), locale);
  const categoryName = cat?.name || cat?.translation?.name || SLUG;

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
