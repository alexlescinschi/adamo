import { NextRequest, NextResponse } from "next/server";

const IUTE_BASE = "https://ecom.iutecredit.md";
const CRM_CONFIG_URL = "https://api.crm.adamo.md/v1/ecommerce/checkout/iute/config";

let cachedPublicKey: string = "";
let cachedAt = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getPublicKey(): Promise<string> {
  if (cachedPublicKey && Date.now() - cachedAt < CACHE_TTL) return cachedPublicKey;
  const res = await fetch(CRM_CONFIG_URL, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error("CRM config unreachable");
  const data = await res.json();
  cachedPublicKey = data?.public_api_key || "";
  cachedAt = Date.now();
  return cachedPublicKey || "";
}

export async function GET(request: NextRequest) {
  const price = Number(request.nextUrl.searchParams.get("price") || "0");
  if (!price || price <= 0) {
    return NextResponse.json({ error: "Missing price" }, { status: 400 });
  }

  try {
    const publicKey = await getPublicKey();
    if (!publicKey) {
      return NextResponse.json({ error: "IutePay not configured" }, { status: 503 });
    }

    // Smart 0%: 4 luni, 0% dobândă — calcul exact
    const smart = Math.round(price / 4);

    // Flexi Shop: valoare reală din API IutePay
    const res = await fetch(`${IUTE_BASE}/api/v1/eshop/client/eshop-product/-/calculation?monthly=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-iute-api-key": publicKey,
      },
      body: JSON.stringify([{ id: "calc", sku: "calc", amount: price }]),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({
        smart,
        smartPlan: "smart",
        flexi: null,
        flexiPlan: "flexi",
      });
    }

    const data = await res.json();
    const flexi = data?.[0]?.monthlyRepayment || null;

    return NextResponse.json({
      smart,
      smartPlan: "smart",
      flexi,
      flexiPlan: "flexi",
    });
  } catch {
    // Fallback: smart only, flexi not available
    const smart = Math.round(price / 4);
    return NextResponse.json({
      smart,
      smartPlan: "smart",
      flexi: null,
      flexiPlan: "flexi",
    });
  }
}
