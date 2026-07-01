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
    ...(p.toZipcode ? { to_zipcode: p.toZipcode } : {}),
    to_str: p.toStreet,
    ...(p.toNr ? { to_nr: p.toNr } : {}),
    ...(p.toBl ? { to_bl: p.toBl } : {}),
    ...(p.toAp ? { to_ap: p.toAp } : {}),
    to_phone: p.toPhone,
    ...(p.toEmail ? { to_email: p.toEmail } : {}),
    type: "package",
    service_type: "standard",
    weight: WEIGHT,
    length: process.env.FANCOURIER_LENGTH ?? "20",
    height: process.env.FANCOURIER_HEIGHT ?? "20",
    width: process.env.FANCOURIER_WIDTH ?? "10",
    content: "Electronice",
    cnt: "1",
    ...(p.orderRef ? { customer_reference: p.orderRef } : {}),
    ...(p.cod !== undefined && p.cod > 0 ? { ramburs: String(p.cod), ramburs_type: "cash" } : {}),
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
      ...(zipcode ? { to_zipcode: zipcode } : {}),
      weight: WEIGHT,
      type: "package",
      service_type: "standard",
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
