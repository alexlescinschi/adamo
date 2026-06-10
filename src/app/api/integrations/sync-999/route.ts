import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/crm-api";
import { getCached } from "@/lib/redis";
import { uploadImage, createAdvert } from "@/lib/999-api";
import { findManufacturerId, findConditionId } from "@/lib/999-mapping";

const PHONE = process.env.N999_PHONE || "37367550980";

export async function POST(request: NextRequest) {
  try {
    const { product_id } = await request.json();
    if (!product_id) {
      return NextResponse.json({ error: "Missing product_id" }, { status: 400 });
    }

    const data = await getCached(`999-sync:${product_id}`, () => getProductById(product_id, "ro"), 30);
    if (!data || !data.offerSummary) {
      return NextResponse.json({ error: "Product not found or no offer configured" }, { status: 404 });
    }

    const summary = data.offerSummary;
    const hasStock = (summary.inventoryUnitCount || 0) > 0;
    if (!hasStock) {
      return NextResponse.json({ error: "Product out of stock" }, { status: 400 });
    }

    const price = summary.minPrice || 0;
    const name = data.name || data.translation?.storefrontName || "";
    const description = data.translation?.description || "";
    const productImages = data.images || [];

    const specs: Record<string, string> = {};
    if (Array.isArray(data.specs)) {
      for (const s of data.specs) {
        if (s.label && s.valueLabel) specs[s.label.toLowerCase()] = s.valueLabel;
      }
    }

    const manufacturer = findManufacturerId(specs["producator"] || specs["producător"] || "");
    const condition = findConditionId(specs["stare"] || "");

    const imageIds: string[] = [];
    for (const img of productImages.slice(0, 10)) {
      try {
        const id = await uploadImage(img.url);
        imageIds.push(id);
      } catch (e) {
        console.error(`Failed to upload image ${img.url}:`, e);
      }
    }

    const features: { id: string; value: unknown; unit?: string }[] = [
      { id: "12", value: name },
      { id: "13", value: description },
      { id: "2", value: price, unit: "mdl" },
      { id: "7", value: "12900" },
      { id: "685", value: manufacturer },
      { id: "686", value: "7451" },
      { id: "593", value: condition },
      { id: "16", value: [PHONE] },
    ];

    if (imageIds.length > 0) {
      features.push({ id: "14", value: imageIds });
    }

    const result = await createAdvert({
      category_id: "2",
      subcategory_id: "4",
      offer_type: "776",
      features,
    });

    return NextResponse.json({
      success: true,
      advert_id: result.advert?.id,
      state: result.advert?.state || "unknown",
      message: `Anunț creat pe 999.md în stare "${result.advert?.state || "need_pay"}". Pentru a-l publica, plătește în contul 999.`,
    });
  } catch (error) {
    console.error("999 sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
