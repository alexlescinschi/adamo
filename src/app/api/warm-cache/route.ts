import { NextResponse } from "next/server";
import { getCategoryBySlug, getPublishedProducts, getProductById } from "@/lib/crm-api";
import { getCached } from "@/lib/redis";

async function warmCategory(slug: string) {
  const locale = "ro";
  const [cat, allProductsData] = await Promise.all([
    getCategoryBySlug(slug, locale),
    getPublishedProducts(locale, 500),
  ]);

  const categoryId = cat?.id;
  const allItems = Array.isArray(allProductsData) ? allProductsData : allProductsData?.items || [];
  const items = categoryId ? allItems.filter((p: any) => p.category_id === categoryId) : allItems;

  // Fetch & cache each product with prices+specs
  await Promise.allSettled(
    items.map((p: any) =>
      getCached(`product:${p.id}:${locale}`, () => getProductById(p.id, locale), 120)
    )
  );

  return items.length;
}

export async function GET() {
  try {
    const [minipc, laptops] = await Promise.all([
      warmCategory("minipc"),
      warmCategory("laptops"),
    ]);

    return NextResponse.json({
      ok: true,
      cached: { minipc, laptops },
      ts: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
