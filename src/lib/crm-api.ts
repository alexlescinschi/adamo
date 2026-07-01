import "server-only";
import { unstable_cache } from "next/cache";
import type { CrmPaymentMethod } from "@/lib/checkout";

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

// ponytail: cap de 8s pe orice request CRM — unul blocat nu mai ține renderul la infinit.
const CRM_TIMEOUT_MS = 8000;

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
    // GET-urile cache-uite revalidă la 60s; mutațiile sunt no-store. Timeout pe toate.
    signal: options?.signal ?? AbortSignal.timeout(CRM_TIMEOUT_MS),
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

// ponytail: limiter de concurență fără dependență (max `limit` request-uri simultan).
// Ceiling: simplu, per-apel — dacă throughput-ul cere per-contorizare globală, treci pe p-limit.
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (x: T, i: number) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const i = cursor++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i], i) };
      } catch (e) {
        results[i] = { status: "rejected", reason: e };
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
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

// CRM caps search results at 10 when no `page` is sent and ignores `limit`.
// With `page=N` it returns 12 items/page. searchProductsAll loops through
// pages and combines them (dedup by id) so the storefront sees every match.
const SEARCH_PAGE_SIZE = 12;
const SEARCH_MAX_PAGES = 30; // safety cap: 30 pages × 12 = 360 products

export async function searchProducts(query: string, locale = "ro", page = 1) {
  return crmFetch(`/ecommerce/products/search?q=${encodeURIComponent(query)}&locale=${locale}&page=${page}`);
}

export async function searchProductsAll(
  query: string,
  locale = "ro"
): Promise<{ items: any[] }> {
  const all: any[] = [];
  const seenIds = new Set<number | string>();

  for (let page = 1; page <= SEARCH_MAX_PAGES; page++) {
    const data = await searchProducts(query, locale, page);
    const items = Array.isArray(data?.items) ? data.items : [];

    for (const item of items) {
      const id = item?.id;
      if (id === undefined || seenIds.has(id)) continue;
      seenIds.add(id);
      all.push(item);
    }

    // Stop when a page is empty or partial (< full page) — no more results.
    if (items.length < SEARCH_PAGE_SIZE) break;
  }

  return { items: all };
}

export async function getCategories(locale = "ro") {
  return crmFetch(`/category/categories?locale=${locale}`);
}

export async function getCategoryBySlug(slug: string, locale = "ro") {
  return crmFetch(`/category/categories/${slug}?locale=${locale}`);
}

export interface CategoryProductsQuery {
  page?: number;
  limit?: number;
  sort?: string;
  priceMin?: number;
  priceMax?: number;
  // Atribute de filtrare server-side: { "memorie-ram": ["16gb", "32gb"], "producator": ["asus"] }.
  // CRM: OR în interiorul facetării (virgulă), AND între facetări. Transformat în f_{code}=v1,v2.
  attributes?: Record<string, string[]>;
  q?: string;
}

// Endpoint PUBLIC de storefront: carduri complete (preț/imagine/stoc) + paginare nativă.
// ponytail: cardul de listă vine complet din API → zero enrich, zero apel CRM per-produs.
export async function getCategoryProducts(
  slug: string,
  locale = "ro",
  opts: CategoryProductsQuery = {}
) {
  const p = new URLSearchParams({
    locale,
    page: String(opts.page ?? 1),
    limit: String(opts.limit ?? 24),
  });
  if (opts.sort) p.set("sort", opts.sort);
  if (opts.priceMin != null) p.set("price_min", String(opts.priceMin));
  if (opts.priceMax != null) p.set("price_max", String(opts.priceMax));
  if (opts.attributes) {
    for (const [code, values] of Object.entries(opts.attributes)) {
      if (values?.length) p.set(`f_${code}`, values.join(","));
    }
  }
  if (opts.q) p.set("q", opts.q);
  return crmFetch(`/category/categories/${slug}/products?${p.toString()}`);
}

export async function getPickupWarehouses() {
  return crmFetch(`/ecommerce/warehouses/pickup`);
}

export interface CheckoutPayload {
  items: { product_id: number; unit_id: number; qty: number }[];
  delivery_method: "PICKUP" | "COURIER";
  payment_method: CrmPaymentMethod;
  warehouse_id?: number;
  contact: {
    phone: string;
    email?: string;
    full_name?: string;
  };
  delivery?: Record<string, unknown>;
  comment?: string;
  // Required by CRM when payment_method = BANK_TRANSFER (nested object)
  bank_transfer?: {
    company_name:  string;
    legal_address: string;
    fiscal_code:   string;
    vat_code:      string;
    iban:          string;
    bank_code:     string;
  };
}

export async function createOrder(payload: CheckoutPayload, ecommerceToken?: string) {
  const headers: Record<string, string> = {};
  if (ecommerceToken) {
    headers["Cookie"] = `ecommerceAccessToken=${ecommerceToken}`;
  }
  return crmFetch(`/ecommerce/checkout/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers,
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
  // ponytail: CRM expects digits-only phone (E.164 without +), strip formatting
  const cleanPhone = data.phone.replace(/[^\d]/g, "");
  return crmFetch(`/contacts`, {
    method: "POST",
    body: JSON.stringify({ ...data, phone: cleanPhone }),
  });
}

// Refresh an expired ecommerce access token using the refresh cookie.
// Returns new tokens or null if refresh fails.
const CRM_TOKEN_MAX_AGE = 15 * 60; // 15 min, matches CRM expiresIn
const CRM_REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export { CRM_TOKEN_MAX_AGE, CRM_REFRESH_MAX_AGE };

export async function refreshCrmToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string } | null> {
  try {
    const res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.accessToken) return null;
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  } catch {
    return null;
  }
}

export async function getHomeCarousel(locale = "ro") {
  return crmFetch(`/ecommerce/banners/home-carousel?locale=${locale}`);
}

export async function getHomeStaticBanners(locale = "ro") {
  return crmFetch(`/ecommerce/banners/home-static-banners?locale=${locale}`);
}
