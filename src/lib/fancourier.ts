const BASE = "https://app.fancourier.md/fan/API";
const WEIGHT = process.env.FANCOURIER_WEIGHT_DEFAULT ?? "1";

export interface AwbParams {
  toName: string;
  toCity: string;
  toZipcode: string;
  toStreet: string;
  toNr?: string;
  toBl?: string;
  toAp?: string;
  toPhone: string;
  toEmail?: string;
  orderRef?: string;
  cod?: number;
}

export interface AwbResult {
  awb: string;
  trackingUrl: string;
}

export async function createFanCourierAwb(p: AwbParams): Promise<AwbResult> {
  const apiKey = process.env.FANCOURIER_API_KEY;
  if (!apiKey) throw new Error("FANCOURIER_API_KEY not set");

  const body = new URLSearchParams({
    api_key: apiKey,
    from_name: '"Adamo Computers" SRL',
    from_city: "Chisinau",
    from_country: "MD",
    from_phone: "+37379966909",
    from_email: "adamocomputers@gmail.com",
    to_name: p.toName,
    to_city: p.toCity,
    to_country: "MD",
    to_zipcode: p.toZipcode || "2000",
    to_str: p.toStreet,
    ...(p.toNr ? { to_nr: p.toNr } : {}),
    ...(p.toBl ? { to_bl: p.toBl } : {}),
    ...(p.toAp ? { to_ap: p.toAp } : {}),
    to_phone: p.toPhone,
    to_email: p.toEmail ?? "",
    type: "Colet",
    service_type: "Standard",
    weight: WEIGHT,
    dimensions: process.env.FANCOURIER_DIMENSIONS ?? "20x20x10",
    content: "Electronice",
    cnt: "1",
    ...(p.orderRef ? { customer_reference: p.orderRef } : {}),
    ...(p.cod !== undefined && p.cod > 0 ? { ramburs: String(p.cod) } : {}),
  });

  const res = await fetch(`${BASE}/create_shipment`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`FanCourier HTTP ${res.status}`);

  const json = await res.json();
  if (json.status !== "done") {
    throw new Error(json.message || json.error || "FanCourier error");
  }

  const awb = String(json.data?.no ?? "");
  return { awb, trackingUrl: `https://app.fancourier.md/tracking?awb=${awb}` };
}

export async function getFanCourierPrice(
  city: string,
  zipcode: string
): Promise<{ price: number; zone: string } | null> {
  const apiKey = process.env.FANCOURIER_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      from_city: "Chisinau",
      from_country: "MD",
      to_city: city,
      to_country: "MD",
      to_zipcode: zipcode || "2000",
      weight: WEIGHT,
      type: "Colet",
      service_type: "Standard",
    });

    const res = await fetch(`${BASE}/get_price?${params.toString()}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== "done") return null;
    return { price: Number(json.data?.price ?? 0), zone: String(json.data?.zone ?? "") };
  } catch {
    return null;
  }
}
