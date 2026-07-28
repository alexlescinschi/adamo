import { NextRequest, NextResponse } from "next/server";
import { getPublishedProducts, getPopularProducts, getPromotions, getNewProducts } from "@/lib/crm-api";
import { getCached } from "@/lib/redis";
import { mapProductCard } from "@/lib/product-mapper";
import { normalizeLocale } from "@/lib/locale";

function transformProduct(item: any) {
  return {
    ...mapProductCard(item),
    category_id: item.category_id,
    is_published: item.is_published,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "popular";
  const locale = normalizeLocale(searchParams.get("locale") || undefined);
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

    return NextResponse.json(products);
  } catch (error) {
    console.error("API products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
