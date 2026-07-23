import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdvert, uploadImage } from "@/lib/999-api";
import { findConditionId, findManufacturerId } from "@/lib/999-mapping";
import { getProductById } from "@/lib/crm-api";
import { getCached, rateLimit, redis } from "@/lib/redis";

const PHONE = process.env.N999_PHONE || "37367550980";

function authorized(header: string | null, secret: string) {
  const value = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const actual = Buffer.from(value);
  const expected = Buffer.from(secret);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: NextRequest) {
  const secret = process.env.SYNC_999_SECRET || "";
  if (!secret) return NextResponse.json({ error: "Integration is not configured" }, { status: 503 });
  if (!authorized(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!redis && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Integration is temporarily unavailable" }, { status: 503 });
  }

  const globalLimit = await rateLimit("rate:sync-999", 10, 60);
  if (!globalLimit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let productId: number;
  try {
    const body = await request.json();
    productId = Number(body?.product_id);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid product_id" }, { status: 400 });
  }

  const productLimit = await rateLimit(`rate:sync-999:${productId}`, 2, 3600);
  if (!productLimit.allowed) return NextResponse.json({ error: "Product sync limit reached" }, { status: 429 });

  const ledgerKey = `sync-999:v1:${productId}`;
  if (redis) {
    const existing = await redis.get<Record<string, unknown>>(ledgerKey);
    if (existing?.status === "created") return NextResponse.json({ ...existing, reused: true });
    if (existing) return NextResponse.json({ error: "Product sync requires reconciliation" }, { status: 409 });
    const claimed = await redis.set(ledgerKey, { status: "processing" }, { nx: true, ex: 900 });
    if (!claimed) return NextResponse.json({ error: "Product sync is already processing" }, { status: 409 });
  }

  try {
    const data = await getCached(`999-product:${productId}`, () => getProductById(productId, "ro"), 30);
    const summary = data?.offerSummary;
    if (!summary) return NextResponse.json({ error: "Product not found or no offer configured" }, { status: 404 });
    if ((summary.inventoryUnitCount || 0) <= 0) return NextResponse.json({ error: "Product out of stock" }, { status: 400 });

    const name = String(data.name || data.translation?.storefrontName || "").slice(0, 200);
    const description = String(data.translation?.description || "").slice(0, 5000);
    const price = Number(summary.minPrice || 0);
    if (!name || !Number.isFinite(price) || price <= 0) throw new Error("Invalid CRM product");

    const specs: Record<string, string> = {};
    if (Array.isArray(data.specs)) {
      for (const spec of data.specs) {
        if (spec?.label && spec?.valueLabel) specs[String(spec.label).toLowerCase()] = String(spec.valueLabel);
      }
    }

    const imageIds: string[] = [];
    for (const image of Array.isArray(data.images) ? data.images.slice(0, 10) : []) {
      if (typeof image?.url !== "string") continue;
      try {
        imageIds.push(await uploadImage(image.url));
      } catch {
        // A bad image does not block an otherwise valid advert.
      }
    }

    const features: { id: string; value: unknown; unit?: string }[] = [
      { id: "12", value: name },
      { id: "13", value: description },
      { id: "2", value: price, unit: "mdl" },
      { id: "7", value: "12900" },
      { id: "685", value: findManufacturerId(specs["producator"] || specs["producător"] || "") },
      { id: "686", value: "7451" },
      { id: "593", value: findConditionId(specs["stare"] || "") },
      { id: "16", value: [PHONE] },
    ];
    if (imageIds.length) features.push({ id: "14", value: imageIds });

    const result = await createAdvert({ category_id: "2", subcategory_id: "4", offer_type: "776", features });
    const response = {
      status: "created",
      success: true,
      advert_id: result.advert?.id,
      state: result.advert?.state || "unknown",
      reused: false,
    };
    if (redis) await redis.set(ledgerKey, response, { ex: 90 * 24 * 60 * 60 });
    return NextResponse.json(response);
  } catch {
    if (redis) await redis.set(ledgerKey, { status: "unknown" }, { ex: 24 * 60 * 60 });
    return NextResponse.json({ error: "999 sync failed; verify the provider before retrying" }, { status: 502 });
  }
}
