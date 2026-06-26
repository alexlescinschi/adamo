import { NextRequest, NextResponse } from "next/server";
import { getCategoryProducts, getPublishedProducts, getCategoryBySlug } from "@/lib/crm-api";
import { getCached } from "@/lib/redis";

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
    unit_id: item.units?.[0]?.id ?? item.offerSummary?.priceTiers?.[0]?.representativeUnitId ?? item.id,
    category_id: item.category_id,
    is_published: item.is_published,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get("locale") || "ro";
  const limit = parseInt(searchParams.get("limit") || "24", 10);

  try {
    const cacheKey = `category-products:${slug}:${locale}:${limit}`;
    let data = await getCached(cacheKey, () => getCategoryProducts(slug, locale, { limit }), 120);

    // Fallback to all published products filtered by category
    if (!data?.items?.length) {
      const catData = await getCached(`category:${slug}:${locale}`, () => getCategoryBySlug(slug, locale), 120);
      const categoryId = catData?.id;

      const allProducts = await getCached(`published:${locale}:100`, () => getPublishedProducts(locale, 100), 120);
      const items = (allProducts?.items || allProducts || []).filter((p: any) => p.category_id === categoryId);
      data = { items: items.slice(0, limit), total: items.length, page: 1, limit, totalPages: 1 };
    }

    const items = data?.items || [];
    const products = Array.isArray(items) ? items.map(transformProduct) : [];
    return NextResponse.json({ items: products, total: data?.total || products.length, page: 1, limit, totalPages: 1 });
  } catch (error) {
    console.error("API category products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
