import "server-only";
import { redis } from "./redis";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";
const CRM_LOGIN = process.env.CRM_API_LOGIN || "";
const CRM_PASSWORD = process.env.CRM_API_PASSWORD || "";

const TOKEN_CACHE_KEY = "crm:access_token";

interface LoginResponse {
  accessToken: string;
  expiresIn: string;
}

async function getAccessToken(): Promise<string> {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const cached = await redis.get<string>(TOKEN_CACHE_KEY);
      if (cached) return cached;
    } catch {
      // ignore
    }
  }

  const res = await fetch(`${CRM_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: CRM_LOGIN, password: CRM_PASSWORD }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CRM login failed ${res.status}: ${text}`);
  }

  const data: LoginResponse = await res.json();

  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      await redis.set(TOKEN_CACHE_KEY, data.accessToken, { ex: 12 * 60 });
    } catch {
      // ignore
    }
  }

  return data.accessToken;
}

async function crmFetch(path: string, options?: RequestInit) {
  const token = await getAccessToken();
  const url = `${CRM_BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CRM API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getPublishedProducts(locale = "ro", limit = 12) {
  return crmFetch(`/products?locale=${locale}&limit=${limit}`);
}

export async function getPopularProducts(locale = "ro", limit = 12) {
  return crmFetch(`/ecommerce/products/storefront/popular?locale=${locale}&limit=${limit}`);
}

export async function getPromotions(locale = "ro", limit = 12) {
  return crmFetch(`/ecommerce/products/storefront/promotions?locale=${locale}&limit=${limit}`);
}

export async function getNewProducts(locale = "ro", limit = 12) {
  return crmFetch(`/ecommerce/products/storefront/new?locale=${locale}&limit=${limit}`);
}

export async function getProductById(id: number | string, locale = "ro") {
  try {
    return await crmFetch(`/ecommerce/products/${id}?locale=${locale}`);
  } catch {
    return crmFetch(`/products/${id}?locale=${locale}`);
  }
}

export async function searchProducts(query: string, locale = "ro", limit = 24) {
  return crmFetch(`/ecommerce/products/search?q=${encodeURIComponent(query)}&locale=${locale}&limit=${limit}`);
}

export async function getCategories(locale = "ro") {
  return crmFetch(`/category/categories?locale=${locale}`);
}

export async function getCategoryBySlug(slug: string, locale = "ro") {
  return crmFetch(`/category/categories/${slug}?locale=${locale}`);
}

export async function getCategoryProducts(slug: string, locale = "ro", limit = 24) {
  return crmFetch(`/category/categories/${slug}/products?locale=${locale}&limit=${limit}`);
}

export async function getPickupWarehouses() {
  return crmFetch(`/ecommerce/warehouses/pickup`);
}

export interface CheckoutPayload {
  items: { product_id: number; unit_id: number; qty: number }[];
  delivery_method: "PICKUP" | "COURIER";
  payment_method: "ONLINE" | "BANK_TRANSFER";
  warehouse_id?: number;
  contact: {
    phone: string;
    email?: string;
    full_name?: string;
  };
  delivery?: Record<string, unknown>;
  comment?: string;
}

export async function createOrder(payload: CheckoutPayload) {
  return crmFetch(`/ecommerce/checkout/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getOrderInvoice(orderId: number, token: string) {
  return crmFetch(`/ecommerce/checkout/orders/${orderId}/invoice?token=${token}`);
}
