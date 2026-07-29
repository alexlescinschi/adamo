import { NextRequest, NextResponse } from "next/server";
import { getCategoryProducts } from "@/lib/crm-api";
import { mapProductCard } from "@/lib/product-mapper";
import { normalizeLocale } from "@/lib/locale";

export async function GET(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  // Extract slug from pathname: /api/category/laptops → laptops
  const slug = pathname.split("/").pop() || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Number(searchParams.get("limit")) || 24);
  const locale = normalizeLocale(searchParams.get("locale") || undefined);

  // Parse attribute filters: f_display=15.6,14 → { display: ["15.6", "14"] }
  const attributes: Record<string, string[]> = {};
  for (const [key, val] of searchParams.entries()) {
    if (key.startsWith("f_") && val) {
      attributes[key.slice(2)] = val.split(",").filter(Boolean);
    }
  }

  const priceMin = searchParams.get("price_min");
  const priceMax = searchParams.get("price_max");

  try {
    const data: any = await getCategoryProducts(slug, locale, {
      page,
      limit,
      sort: searchParams.get("sort") || undefined,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      priceMin: priceMin != null ? Number(priceMin) : undefined,
      priceMax: priceMax != null ? Number(priceMax) : undefined,
    });
    return NextResponse.json({
      ...data,
      items: (data?.items || []).map(mapProductCard),
    });
  } catch {
    return NextResponse.json({ items: [], total: 0, totalPages: 1 });
  }
}
