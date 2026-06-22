import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/crm-api";
import { getCached } from "@/lib/redis";
import { mapProductCard } from "@/lib/product-mapper";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || "";
  const locale = searchParams.get("locale") || "ro";
  const limit = parseInt(searchParams.get("limit") || "24", 10);

  if (!q.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const cacheKey = `search:${q}:${locale}:${limit}`;
    const data = await getCached(cacheKey, () => searchProducts(q, locale, limit), 30);
    const items = data?.items || [];
    const products = Array.isArray(items) ? items.map(mapProductCard) : [];
    return NextResponse.json({ items: products });
  } catch (error) {
    console.error("API search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
