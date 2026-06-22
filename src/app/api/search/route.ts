import { NextRequest, NextResponse } from "next/server";
import { searchProductsAll } from "@/lib/crm-api";
import { getCached } from "@/lib/redis";
import { mapProductCard } from "@/lib/product-mapper";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || "";
  const locale = searchParams.get("locale") || "ro";

  if (!q.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    // searchProductsAll combines every CRM page (dedup by id) — cache key reflects that.
    const cacheKey = `search:${q}:${locale}:all`;
    const data = await getCached(cacheKey, () => searchProductsAll(q, locale), 30);
    const items = data?.items || [];
    const products = Array.isArray(items) ? items.map(mapProductCard) : [];
    return NextResponse.json({ items: products });
  } catch (error) {
    console.error("API search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
