import { getCategoryBySlug, getPublishedProducts, getPopularProducts, getPromotions, getNewProducts, getProductById } from "@/lib/crm-api";
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
    unit_id: item.units?.[0]?.id ?? item.offerSummary?.priceTiers?.[0]?.representativeUnitId ?? item.id,
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
  return detail?.offerSummary?.inventoryUnitCount ?? detail?.units_on_warehouse ?? undefined;
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

export default async function LaptopuriPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ type?: string }> }) {
  const { locale } = await params;
  const { type } = await searchParams;
  const PER_PAGE = 8;

  const cat = await getCategoryBySlug(SLUG, locale);
  const categoryId = cat?.id;

  // ponytail: CRM dedicated endpoints for filtered listings
  let allProductsData: any;
  if (type === "popular") {
    allProductsData = await getPopularProducts(locale, 200);
  } else if (type === "promotions") {
    allProductsData = await getPromotions(locale, 200);
  } else if (type === "new") {
    allProductsData = await getNewProducts(locale, 200);
  } else {
    allProductsData = await getPublishedProducts(locale, 500);
  }

  const allItems = Array.isArray(allProductsData) ? allProductsData : (allProductsData as any)?.items || [];
  const items = categoryId ? allItems.filter((p: any) => p.category_id === categoryId) : allItems;
  const products = await enrichWithSpecs(items.map(extractBase), locale);
  const categoryName = cat?.name || cat?.translation?.name || SLUG;

  const titleByType: Record<string, string> = {
    popular: "Laptopuri populare",
    promotions: "Promoții",
    new: "Noutăți",
  };
  const displayName = type ? (titleByType[type] || categoryName) : categoryName;

  return (
    <div className="py-6">
      <div className="flex items-center gap-2 text-sm text-[#6b6c6c] mb-4">
        <Link href="/" className="hover:text-[#1d1d1f] transition-colors">Acasă</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[#1d1d1f]">{displayName}</span>
      </div>
      <Suspense fallback={null}>
        <CategoryFilter products={products} categoryName={categoryName} page={1} perPage={PER_PAGE} />
      </Suspense>
    </div>
  );
}
