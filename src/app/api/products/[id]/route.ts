import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/crm-api";
import { getCached } from "@/lib/redis";

function transformProduct(data: any) {
  // Rich storefront product
  if (data?.offerSummary) {
    return {
      id: data.id,
      name: data.name || data.translation?.storefrontName,
      slug: data.slug,
      description: data.translation?.description || "",
      price: data.offerSummary?.minPrice || 0,
      old_price: data.discount?.originalPrice || undefined,
      image_url: data.images?.[0]?.url || null,
      images: data.images || [],
      specs: data.specs || {},
      availability: data.offerSummary?.availability || "OutOfStock",
    };
  }
  const price = data.offerSummary?.minPrice || data.minPrice || data.price || 0;
  const oldPrice = data.discount?.originalPrice || data.oldPrice || data.old_price;

  return {
    id: data.id,
    name: data.storefrontName || data.name,
    slug: data.slug,
    description: data.translations?.find((t: any) => t.locale === "ro")?.description || "",
    price,
    old_price: oldPrice > price ? oldPrice : undefined,
    image_url: data.previewImageUrl || null,
    images: data.previewImageUrl ? [{ url: data.previewImageUrl }] : [],
    specs: {},
    availability: "OutOfStock",
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get("locale") || "ro";

  try {
    const cacheKey = `product:${id}:${locale}`;
    const data = await getCached(cacheKey, () => getProductById(id, locale), 120);
    const product = transformProduct(data);
    return NextResponse.json(product);
  } catch (error) {
    console.error("API product error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
