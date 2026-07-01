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
        item_type: 1, // ponytail: "Palet" default, verify via /nomenclatures/item-types if needed
      },
    ],
    sender_name: '"Adamo Computers" SRL',
    sender_phone_number: 37379966909,
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
            item_type: 1,
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
