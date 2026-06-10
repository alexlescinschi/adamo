import { NextRequest, NextResponse } from "next/server";
import { getPublishedProducts, getPopularProducts, getPromotions, getNewProducts } from "@/lib/crm-api";
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
    unit_id: item.id,
    category_id: item.category_id,
    is_published: item.is_published,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "popular";
  const locale = searchParams.get("locale") || "ro";
  const limit = parseInt(searchParams.get("limit") || "12", 10);

  try {
    let data;
    const cacheKey = `products:${type}:${locale}:${limit}`;

    // Try storefront-specific endpoints first, fallback to all published products
    switch (type) {
      case "popular":
        data = await getCached(cacheKey, () => getPopularProducts(locale, limit), 120);
        if (!data?.items?.length) {
          data = await getCached(`published:${locale}:${limit}`, () => getPublishedProducts(locale, limit), 120);
        }
        break;
      case "promotions":
        data = await getCached(cacheKey, () => getPromotions(locale, limit), 120);
        if (!data?.items?.length) {
          data = await getCached(`published:${locale}:${limit}`, () => getPublishedProducts(locale, limit), 120);
        }
        break;
      case "new":
        data = await getCached(cacheKey, () => getNewProducts(locale, limit), 120);
        if (!data?.items?.length) {
          data = await getCached(`published:${locale}:${limit}`, () => getPublishedProducts(locale, limit), 120);
        }
        break;
      default:
        data = await getCached(cacheKey, () => getPublishedProducts(locale, limit), 120);
    }

    // Normalize response
    const items = data?.items || data || [];
    const products = Array.isArray(items) ? items.map(transformProduct) : [];

    return NextResponse.json(products, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("API products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
