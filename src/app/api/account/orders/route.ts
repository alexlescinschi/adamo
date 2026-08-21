import { NextRequest, NextResponse } from "next/server";
import { crmFetch, refreshCrmToken, CRM_TOKEN_MAX_AGE, CRM_REFRESH_MAX_AGE } from "@/lib/crm-api";
import { getPostaShipmentStatus, type PostaShipmentStatus } from "@/lib/posta-rapida";
import { redis } from "@/lib/redis";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

type StoredShipment = {
  provider?: string;
  status?: string;
  shippingNumber?: string;
  awb?: string | null;
};

async function getShipment(orderId: number): Promise<PostaShipmentStatus | null> {
  if (!redis) return null;
  try {
    const shipment = await redis.get<StoredShipment>(`shipment:v1:POSTA_RAPIDA:${orderId}`);
    if (shipment?.provider !== "POSTA_RAPIDA" || !shipment.shippingNumber) return null;

    const cacheKey = `shipment:v1:tracking:${shipment.shippingNumber}`;
    const cached = await redis.get<PostaShipmentStatus>(cacheKey);
    if (cached) return cached;

    const tracked = await getPostaShipmentStatus(shipment.shippingNumber);
    await redis.set(cacheKey, tracked, { ex: 300 });
    return tracked;
  } catch (error) {
    console.error("Shipment tracking error:", { orderId, error: error instanceof Error ? error.message : "Unknown error" });
    return null;
  }
}

function normalizeItem(item: any) {
  const product = item.product || item.unit?.product || {};
  return {
    id: item.id,
    product_id: item.product_id ?? product.id,
    name: product.name || item.name || `Produs #${item.product_id ?? item.id}`,
    qty: Number(item.qty ?? item.quantity ?? 1),
    price: Number(item.price ?? item.base_price ?? 0),
  };
}

function normalizeDeal(d: any) {
  const items = d.positions || d.items || d.lines || [];
  return {
    id: d.id,
    created_at: d.created_at,
    status: d.stage?.name || d.stage_name || (typeof d.status === "string" ? d.status : d.status?.name),
    status_slug: d.stage?.slug || d.stage_slug || d.status_slug || d.status?.slug || null,
    items: Array.isArray(items) ? items.map(normalizeItem) : [],
    total: Number(d.amount ?? d.final_total ?? d.total ?? 0),
  };
}

async function normalizeDealsList(data: any) {
  const list = Array.isArray(data) ? data : data?.items || data?.deals || data?.data || [];
  if (!Array.isArray(list)) return [];

  const detailed = await Promise.all(list.map(async (deal: any) => {
    if (!Number.isSafeInteger(deal?.id) || deal.id < 1) return deal;
    const hasDetailedItems = Array.isArray(deal.items)
      && deal.items.length > 0
      && deal.items.every((item: any) => item.product?.name || item.unit?.product?.name || item.name);
    if (hasDetailedItems) return deal;

    try {
      const data = await crmFetch(`/deals/${deal.id}`);
      return { ...deal, ...(data?.order || data) };
    } catch (error) {
      console.error("Account order detail error:", {
        orderId: deal.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return deal;
    }
  }));

  const orders = detailed.map(normalizeDeal);
  return Promise.all(orders.map(async (order) => ({
    ...order,
    shipment: Number.isSafeInteger(order.id) ? await getShipment(order.id) : null,
  })));
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("ecommerceAccessToken")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let res = await fetch(`${CRM_BASE_URL}/ecommerce/account/deals`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Token expired — try refresh
    if (res.status === 401) {
      const refreshToken = request.cookies.get("ecommerceRefreshToken")?.value;
      if (refreshToken) {
        const refreshed = await refreshCrmToken(refreshToken);
        if (refreshed) {
          res = await fetch(`${CRM_BASE_URL}/ecommerce/account/deals`, {
            headers: { Authorization: `Bearer ${refreshed.accessToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            const response = NextResponse.json(await normalizeDealsList(data));
            setTokenCookies(response, refreshed);
            return response;
          }
        }
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(await normalizeDealsList(data));
  } catch (error) {
    console.error("Account orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

function setTokenCookies(response: NextResponse, tokens: { accessToken: string; refreshToken?: string }) {
  response.cookies.set("ecommerceAccessToken", tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CRM_TOKEN_MAX_AGE,
  });
  if (tokens.refreshToken) {
    response.cookies.set("ecommerceRefreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CRM_REFRESH_MAX_AGE,
    });
  }
}
