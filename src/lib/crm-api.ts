import "server-only";
import { unstable_cache } from "next/cache";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";
const CRM_LOGIN = process.env.CRM_API_LOGIN || "";
const CRM_PASSWORD = process.env.CRM_API_PASSWORD || "";

interface LoginResponse {
  accessToken: string;
  expiresIn: string;
}

const getAccessToken = unstable_cache(
  async (): Promise<string> => {
    const res = await fetch(`${CRM_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: CRM_LOGIN, password: CRM_PASSWORD }),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`CRM login failed ${res.status}: ${text}`);
    }

    const data: LoginResponse = await res.json();
    return data.accessToken;
  },
  ["crm-access-token"],
  { revalidate: 12 * 60 * 60 }
);

async function crmFetch(path: string, options?: RequestInit) {
  const token = await getAccessToken();
  const url = `${CRM_BASE_URL}${path}`;

  const isMutation = options?.method && options.method !== "GET";

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...(isMutation
      ? { cache: "no-store" }
      : { next: { revalidate: 60 } }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CRM API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getPublishedProducts(locale = "ro", limit = 200) {
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
  // Required by CRM when payment_method = BANK_TRANSFER
  company_name?: string;
  legal_address?: string;
  fiscal_code?: string;
  vat_code?: string;
  iban?: string;
  bank_code?: string;
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

export async function updateOrderPaymentStatus(orderId: number, status: string) {
  return crmFetch(`/ecommerce/checkout/orders/${orderId}/payment`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function createContact(data: { first_name: string; last_name: string; phone: string; email?: string; notes?: string }) {
  return crmFetch(`/contacts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getHomeCarousel(locale = "ro") {
  return crmFetch(`/ecommerce/banners/home-carousel?locale=${locale}`);
}

export async function getHomeStaticBanners(locale = "ro") {
  return crmFetch(`/ecommerce/banners/home-static-banners?locale=${locale}`);
}
