import "server-only";
import { unstable_cache } from "next/cache";
import crypto from "crypto";
import { updateOrderPaymentStatus } from "@/lib/crm-api";

// ponytail: IutePay (IuteCredit) BNPL gateway — redirect mode.
// Admin key creează session server-side (POST /api/v1/eshop/client/checkout),
// browser redirect la checkout.url. Public key doar pt iutepay.js.
//
// Payload conform docs redirect mode:
//   merchant.{redirectSuccessUrl, redirectCancelUrl, userConfirmationUrl,
//             userCancelUrl, userConfirmationUrlAction:"POST", name}
//   shipping.{name.first, name.last, address.*, phoneNumber, email}
//   items[{displayName, sku, unitPrice, qty, itemImageUrl, itemUrl}]
//   orderId (top-level), currency (ISO3), shippingAmount, taxAmount,
//   subtotal, total (loan application amount)

const IUTE_BASE_URL =
  process.env.IUTE_BASE_URL || "https://ecom-stage.iutecredit.md";
const IUTE_ADMIN_KEY = process.env.IUTE_ADMIN_KEY || "";
const IUTE_PUBLIC_KEY = process.env.IUTE_PUBLIC_KEY || "";
// ponytail: limba UI IutePay (al doilea arg la iute.configure). ADAMO default: ro.
const IUTE_LANG = process.env.IUTE_LANG || "ro";
// env = stage|live. Intră în calea public-key: stage-mda-public-key.pem
const IUTE_ENV = (process.env.IUTE_ENV || "stage").toLowerCase();
// Țară ISO3 pt public-key path + shipping.address.country. MD → mda.
const IUTE_COUNTRY_ISO3 = (process.env.IUTE_COUNTRY_ISO3 || "mda").toLowerCase();

export const IUTE_CONFIGURED = Boolean(IUTE_ADMIN_KEY && IUTE_PUBLIC_KEY);
export const IUTE_PUBLIC_KEY_BROWSER = IUTE_PUBLIC_KEY;
export const IUTE_LANG_BROWSER = IUTE_LANG;
export const IUTE_SCRIPT_URL = `${IUTE_BASE_URL}/iutepay.js`;
export const IUTE_STYLE_URL = `${IUTE_BASE_URL}/iutepay.css`;

// Site URL pt redirect URL-uri trimise către IutePay.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_VERCEL_URL ||
  "https://adamo3.vercel.app";

// ponytail: split "Ion Pop" → {first:"Ion", last:"Pop"}. Docs cer first+last separate
// și ambele mandatory. Pentru un singur cuvânt ("Ion"), last = "Ion" (nu "-", ar fi respins).
function splitName(fullName: string): { first: string; last: string } {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Client", last: "Client" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export interface IuteItem {
  product_id: number | string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  sku?: string;
}

export interface IuteContact {
  full_name?: string;
  phone?: string;
  email?: string;
}

export interface IuteRedirectRequest {
  orderId: string | number;
  items: IuteItem[];
  contact: IuteContact;
  total: number;
  locale?: string;
}

interface IuteRedirectResponse {
  redirectUrl: string;
  checkoutSessionId: string;
}

// ponytail: creează redirect session. Admin key în header (server-only).
export async function createRedirectSession(
  req: IuteRedirectRequest
): Promise<IuteRedirectResponse> {
  if (!IUTE_ADMIN_KEY) {
    throw new Error("IutePay not configured: IUTE_ADMIN_KEY missing");
  }

  const locale = req.locale || "ro";
  const name = splitName(req.contact.full_name || "");
  const phone = (req.contact.phone || "").replace(/[^\d+]/g, "");

  const redirectSuccess = `${SITE_URL}/${locale}/checkout/iute?status=success&orderId=${req.orderId}`;
  const redirectCancel = `${SITE_URL}/${locale}/checkout/iute?status=cancelled&orderId=${req.orderId}`;
  const webhookConfirm = `${SITE_URL}/api/webhooks/iute`;
  const webhookCancel = `${SITE_URL}/api/webhooks/iute`;

  const items = req.items.map((it) => ({
    displayName: it.name,
    // docs: SKU sau item ID. Fallback product_id dacă CRM nu livrează SKU.
    sku: it.sku ? String(it.sku) : String(it.product_id),
    // ponytail: docs folosesc valoare în moneda locală (1200 = 1200 MDL), NU minor unit.
    unitPrice: Math.round(it.price),
    qty: it.qty,
    itemImageUrl: it.image || "",
    itemUrl: `${SITE_URL}/product/${it.product_id}`,
  }));

  // ponytail: subtotal/total = valoare în moneda locală (nu *100).
  const subtotal = Math.round(req.total);

  // Payload conform docs "Create redirect checkout session".
  const payload = {
    merchant: {
      redirectSuccessUrl: redirectSuccess,
      redirectCancelUrl: redirectCancel,
      userConfirmationUrl: webhookConfirm,
      userCancelUrl: webhookCancel,
      userConfirmationUrlAction: "POST",
      name: "Adamo Computers",
    },
    shipping: {
      name: { first: name.first, last: name.last },
      address: { country: IUTE_COUNTRY_ISO3 },
      phoneNumber: phone,
      email: req.contact.email || "",
    },
    billing: null,
    items,
    currency: "MDL",
    orderId: String(req.orderId),
    shippingAmount: 0,
    taxAmount: 0,
    subtotal,
    total: subtotal,
  };

  const res = await fetch(`${IUTE_BASE_URL}/api/v1/eshop/client/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "x-iute-admin-key": IUTE_ADMIN_KEY,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IutePay createRedirectSession ${res.status}: ${text}`);
  }

  const data = await res.json();
  // docs: { checkoutSessionId, checkout: { url, method } }
  const redirectUrl = data?.checkout?.url || "";
  const checkoutSessionId = data?.checkoutSessionId || "";

  if (!redirectUrl) {
    throw new Error(
      `IutePay: no checkout.url in response: ${JSON.stringify(data)}`
    );
  }

  return { redirectUrl, checkoutSessionId };
}

// ponytail: status comandă IutePay (v2 include SIGNED). Query param: orderId.
export async function getOrderStatus(orderId: string | number) {
  if (!IUTE_ADMIN_KEY) {
    throw new Error("IutePay not configured: IUTE_ADMIN_KEY missing");
  }

  const url = `${IUTE_BASE_URL}/api/v2/eshop/management/eshop-order-status?orderId=${encodeURIComponent(String(orderId))}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "x-iute-admin-key": IUTE_ADMIN_KEY },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IutePay getOrderStatus ${res.status}: ${text}`);
  }

  return res.json();
}

// ponytail: fetch + cache public key IutePay pt verificare webhook (SHA256withRSA).
// Cale: [BASE_URL]/public-key/[env]-[country3]-public-key.pem (ex: stage-mda-public-key.pem).
const getPublicKeyPem = unstable_cache(
  async (): Promise<string> => {
    const url = `${IUTE_BASE_URL}/public-key/${IUTE_ENV}-${IUTE_COUNTRY_ISO3}-public-key.pem`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      throw new Error(`IutePay public key fetch ${res.status}: ${url}`);
    }
    return res.text();
  },
  ["iute-public-key", IUTE_ENV, IUTE_COUNTRY_ISO3],
  { revalidate: 24 * 60 * 60 }
);

// ponytail: verificare semnătură webhook SHA256withRSA.
// Docs: "signature is created based on body and timestamp" — ordinea exactă
// de concatenare NU e detaliată. Încerc ambele (timestamp+body, apoi body+timestamp)
// pt robustețe. Public key descărcată + cache 24h.
export async function verifyWebhookSignature(
  body: string,
  signatureHeader: string,
  timestamp: string
): Promise<boolean> {
  try {
    const publicPem = await getPublicKeyPem();
    const sigBuf = Buffer.from(signatureHeader, "base64");

    // Încearcă timestamp+body.
    const v1 = crypto.createVerify("RSA-SHA256");
    v1.update(`${timestamp}${body}`);
    v1.end();
    if (v1.verify(publicPem, sigBuf)) return true;

    // Încearcă body+timestamp.
    const v2 = crypto.createVerify("RSA-SHA256");
    v2.update(`${body}${timestamp}`);
    v2.end();
    if (v2.verify(publicPem, sigBuf)) return true;

    // Încearcă body singur (posibil conform unor implementări Iute).
    const v3 = crypto.createVerify("RSA-SHA256");
    v3.update(body);
    v3.end();
    return v3.verify(publicPem, sigBuf);
  } catch (err) {
    console.error("[iute] signature verify failed:", err);
    return false;
  }
}

// ponytail: status-uri IutePay v2: PENDING, IN PROGRESS, PAID, CANCELLED, SIGNED.
// docs: "PAID – application approved + signed, OK to ship". Doar PAID = plătit.
// SIGNED = semnat dar disbursare pending → NU marca ca plătit.
const STATUS_PAID = new Set(["PAID"]);
const STATUS_CANCELLED = new Set(["CANCELLED", "REJECTED"]);

export function isPaidStatus(status: string): boolean {
  return STATUS_PAID.has(String(status || "").toUpperCase());
}

export function isCancelledStatus(status: string): boolean {
  return STATUS_CANCELLED.has(String(status || "").toUpperCase());
}

// ponytail: marchează comandă în CRM pe baza status IutePay (din poll/cron).
export async function applyIuteStatusToCrm(
  orderId: string | number,
  status: string
): Promise<void> {
  if (isPaidStatus(status)) {
    await updateOrderPaymentStatus(Number(orderId), "PAID");
    console.log(`[iute] order ${orderId} → CRM PAID`);
  } else if (isCancelledStatus(status)) {
    await updateOrderPaymentStatus(Number(orderId), "CANCELLED");
    console.log(`[iute] order ${orderId} → CRM CANCELLED`);
  }
}

// ponytail: marchează comandă în CRM pe baza webhook body.
// Webhook confirmation: loanAmount = number → PAID.
// Webhook cancellation:  loanAmount = null   → CANCELLED.
export async function updateOrderStatusFromWebhook(
  orderId: string | number,
  isCancellation: boolean
): Promise<void> {
  if (isCancellation) {
    await updateOrderPaymentStatus(Number(orderId), "CANCELLED");
    console.log(`[iute webhook] order ${orderId} → CRM CANCELLED`);
  } else {
    await updateOrderPaymentStatus(Number(orderId), "PAID");
    console.log(`[iute webhook] order ${orderId} → CRM PAID`);
  }
}
