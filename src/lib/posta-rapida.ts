import { ADAMO_COMPANY } from "@/lib/company";

const BASE = "https://curier-rapid-api.posta.md/ecommerce";

export interface PostaAwbParams {
  toName: string;
  toPhone: string;
  toEmail?: string;
  regionId: number;
  cityId: number;
  street: string;
  block: string;
  zipCode?: string;
  orderRef?: string;
  cod?: number;
}

export interface PostaAwbResult {
  shippingNumber: string;
  awb: string | null;
}

export interface PostaShipmentStatus {
  shippingNumber: string;
  awb: string | null;
  status: string;
  updatedAt: string | null;
}

async function postaFetch<T = Record<string, unknown>>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = process.env.CURIERRAPID_API_KEY;
  if (!token) throw new Error("CURIERRAPID_API_KEY not set");

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: init?.signal ?? AbortSignal.timeout(8000),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      typeof json.detail === "string" ? json.detail : `Poșta Moldovei HTTP ${res.status}`,
    );
  }
  return json as T;
}

export async function createPostaAwb(p: PostaAwbParams): Promise<PostaAwbResult> {
  const body: Record<string, unknown> = {
    sender_address: {
      region: 2034, // mun. Chişinău
      city: 659826, // or. Chișinău — ponytail: hardcoded sender IDs, add env vars if moving warehouse
      street: "Dumitru Rîșcanu",
      block: "11",
      zip_code: "MD-2051",
    },
    receiver_address: {
      region: p.regionId,
      city: p.cityId,
      street: p.street,
      block: p.block,
      ...(p.zipCode ? { zip_code: p.zipCode } : {}),
    },
    items: [
      {
        weight: Number(process.env.POSTA_RAPIDA_WEIGHT ?? 1),
        length: Number(process.env.POSTA_RAPIDA_LENGTH ?? 20),
        width: Number(process.env.POSTA_RAPIDA_WIDTH ?? 20),
        height: Number(process.env.POSTA_RAPIDA_HEIGHT ?? 10),
        quantity: 1,
        declared_amount: Number(p.cod || 0),
        description: "Electronice",
        item_type: 2, // Colet
      },
    ],
    sender_name: '"Adamo Computers" SRL',
    sender_phone_number: Number(ADAMO_COMPANY.phoneDigits),
    sender_email: "adamocomputers@gmail.com",
    receiver_name: p.toName,
    receiver_phone_number: Number(p.toPhone.replace(/\D/g, "")),
    ...(p.toEmail ? { receiver_email: p.toEmail } : {}),
    payment_type: p.cod && p.cod > 0 ? "cash" : "transfer",
    ...(p.cod && p.cod > 0 ? { cash_on_delivery_amount: String(p.cod) } : {}),
    declared_amount: String(p.cod || 0),
    payer: "receiver",
    ...(p.orderRef ? { additional_info_client: p.orderRef } : {}),
  };

  const json = await postaFetch<{
    shipping_number: string;
    awb_number: string | null;
  }>("/shipping", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    shippingNumber: json.shipping_number,
    awb: json.awb_number || null,
  };
}

export async function getPostaShipmentStatus(shippingNumber: string): Promise<PostaShipmentStatus> {
  const [shipment, logs] = await Promise.all([
    postaFetch<any>(`/shipping/${encodeURIComponent(shippingNumber)}`),
    postaFetch<any[]>(`/shipping/${encodeURIComponent(shippingNumber)}/logs`),
  ]);
  const latest = Array.isArray(logs)
    ? [...logs].sort((a, b) => Date.parse(b?.created_at || "") - Date.parse(a?.created_at || ""))[0]
    : null;

  return {
    shippingNumber: String(shipment?.shipping_number || shippingNumber),
    awb: shipment?.awb_number ? String(shipment.awb_number) : null,
    status: String(shipment?.status || latest?.action || "created"),
    updatedAt: typeof latest?.created_at === "string" ? latest.created_at : typeof shipment?.modified_at === "string" ? shipment.modified_at : null,
  };
}

export async function getRegions(
  search?: string,
): Promise<{ id: number; name: string }[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const json = await postaFetch<{ results: { id: number; name: string }[] }>(
    `/nomenclatures/regions?${params.toString()}`,
  );
  return json.results || [];
}

export async function getCities(
  regionId: number,
  search?: string,
): Promise<{ id: number; name: string }[]> {
  const params = new URLSearchParams({ region: String(regionId) });
  if (search) params.set("search", search);
  const json = await postaFetch<{ results: { id: number; name: string }[] }>(
    `/nomenclatures/cities?${params.toString()}`,
  );
  return json.results || [];
}

// ponytail: fetch all streets for city, cache 24h — avoid downloading 1000 streets in browser
const streetsCache = new Map<number, { fetched: number; streets: { id: number; name: string }[] }>();

async function fetchAllStreets(cityId: number) {
  const cached = streetsCache.get(cityId);
  if (cached && Date.now() - cached.fetched < 24 * 60 * 60 * 1000) return cached.streets;

  const all: { id: number; name: string }[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`https://main-api.posta.md/nomenclatures/streets?city=${cityId}&per_page=5000&page=${page}`);
    if (!res.ok) break;
    const data = await res.json();
    all.push(...data.results);
    if (!data.results || data.results.length < 5000) break;
    page++;
  }
  streetsCache.set(cityId, { fetched: Date.now(), streets: all });
  return all;
}

export async function getStreets(cityId: number, search?: string) {
  const streets = await fetchAllStreets(cityId);
  if (search) {
    const q = search.toLowerCase();
    return streets.filter((s) => s.name.toLowerCase().includes(q));
  }
  return streets;
}

// ponytail: fetch all blocks for city, cache 24h, filter by street — zip codes don't change daily
const blocksCache = new Map<number, { fetched: number; blocks: { street: number; name: string; zip_code: string; code: string }[] }>();

async function fetchAllBlocks(cityId: number) {
  const cached = blocksCache.get(cityId);
  if (cached && Date.now() - cached.fetched < 24 * 60 * 60 * 1000) return cached.blocks;

  const all: { street: number; name: string; zip_code: string; code: string }[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `https://main-api.posta.md/nomenclatures/blocks?city=${cityId}&per_page=5000&page=${page}`,
    );
    if (!res.ok) break;
    const data = await res.json();
    all.push(...data.results);
    if (!data.results || data.results.length < 5000) break;
    page++;
  }
  blocksCache.set(cityId, { fetched: Date.now(), blocks: all });
  return all;
}

export async function getBlocksForStreet(
  cityId: number,
  streetId: number,
): Promise<{ name: string; zip_code: string }[]> {
  try {
    const blocks = await fetchAllBlocks(cityId);
    return blocks
      .filter((b) => b.street === streetId)
      .map((b) => ({ name: b.name, zip_code: b.zip_code || b.code }));
  } catch {
    return [];
  }
}

export async function getPostaTariff(p: PostaAwbParams): Promise<{ cost: number; estimatedDays: number } | null> {
  try {
    const json = await postaFetch<{ cost: number; estimated_days: number }>("/tariffs/calculate", {
      method: "POST",
      body: JSON.stringify({
        sender_address: {
          region: 2034,
          city: 659826,
          street: "Dumitru Rîșcanu",
        },
        receiver_address: {
          region: p.regionId,
          city: p.cityId,
          street: p.street,
        },
        items: [
          {
            weight: Number(process.env.POSTA_RAPIDA_WEIGHT ?? 1),
            length: Number(process.env.POSTA_RAPIDA_LENGTH ?? 20),
            width: Number(process.env.POSTA_RAPIDA_WIDTH ?? 20),
            height: Number(process.env.POSTA_RAPIDA_HEIGHT ?? 10),
            quantity: 1,
            description: "Electronice",
            item_type: 2,
          },
        ],
        cash_on_delivery_amount: String(p.cod || 0),
        declared_amount: String(p.cod || 0),
        payer: "receiver",
      }),
    });
    return { cost: json.cost, estimatedDays: json.estimated_days };
  } catch {
    return null;
  }
}
