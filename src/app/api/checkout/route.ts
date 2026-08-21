import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { CrmApiError, createOrder, crmFetch, getOrderInvoice, type CheckoutPayload } from "@/lib/crm-api";
import { resolvePaymentMethod, type CourierProvider } from "@/lib/checkout";
import { ADAMO_COMPANY } from "@/lib/company";
import { createFanCourierAwb } from "@/lib/fancourier";
import { createPostaAwb } from "@/lib/posta-rapida";
import { rateLimit, redis } from "@/lib/redis";

type PayMode = "CASH" | "BANK_TRANSFER" | "RATE";

type CheckoutErrorCode =
  | "invalidRequest"
  | "unexpectedField"
  | "invalidItems"
  | "invalidItem"
  | "duplicateItem"
  | "invalidDeliveryMethod"
  | "invalidPaymentMethod"
  | "invalidContact"
  | "invalidEmail"
  | "commentTooLong"
  | "pickupRequired"
  | "deliveryAddressRequired"
  | "invalidPostaAddress"
  | "invalidFanAddress"
  | "courierRequired"
  | "requestTooLarge"
  | "checkoutUnavailable"
  | "rateLimited"
  | "invalidSession"
  | "operationConflict"
  | "alreadyProcessing"
  | "orderUnknown";

type CourierInput =
  | { provider: "POSTA_RAPIDA"; regionId: number; cityId: number; street: string; block: string; zipCode?: string }
  | { provider: "FANCOURIER"; city: string; street: string; postalCode?: string; number?: string; building?: string; apartment?: string };

interface ValidCheckout {
  items: { product_id: number; unit_id: number; qty: number }[];
  deliveryMethod: "PICKUP" | "COURIER";
  payMode: PayMode;
  warehouseId?: number;
  contact: { full_name: string; phone: string; email?: string };
  delivery?: { city: string; address: string };
  courier?: CourierInput;
  comment?: string;
}

type OperationRecord =
  | { state: "processing" | "unknown"; requestHash: string }
  | { state: "completed"; requestHash: string; response: Record<string, unknown> };

type GuestReceipt = {
  orderId: number | string;
  payMode: PayMode;
  deliveryMethod: "PICKUP" | "COURIER";
  courierProvider?: CourierProvider;
  delivery?: { city: string; address: string };
  items: { id: number; name: string; qty: number; price: number }[];
  total: number;
  shipment: Record<string, unknown> | null;
  invoiceUrl?: string;
  invoiceHandle?: string;
};

const MAX_BODY_BYTES = 50_000;
const OPERATION_TTL = 30 * 24 * 60 * 60;
const ALLOWED_KEYS = new Set(["items", "delivery_method", "pay_mode", "warehouse_id", "contact", "delivery", "courier", "comment"]);

function errorResponse(code: CheckoutErrorCode, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error: "Checkout failed", code }, { status, headers });
}

function shortHash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

async function createGuestReceipt(
  orderId: number,
  order: any,
  checkout: ValidCheckout,
  shipment: Record<string, unknown> | null,
  invoice: any,
  invoiceHandle?: string,
) {
  if (!redis) return null;

  let detail = order;
  try {
    detail = await crmFetch(`/deals/${orderId}`);
  } catch {
    // The order is already created; a receipt with product IDs is still useful.
  }

  const sourceItems = detail?.items || detail?.order?.items || order?.items || [];
  const items = Array.isArray(sourceItems)
    ? sourceItems.map((item: any) => ({
        id: Number(item.product_id ?? item.product?.id ?? item.unit?.product?.id ?? item.id),
        name: item.product?.name || item.unit?.product?.name || `Produs #${item.product_id ?? item.id}`,
        qty: Number(item.qty ?? 1),
        price: Number(item.price ?? item.base_price ?? 0),
      }))
    : [];
  const handle = randomBytes(32).toString("base64url");
  const receipt: GuestReceipt = {
    orderId,
    payMode: checkout.payMode,
    deliveryMethod: checkout.deliveryMethod,
    courierProvider: checkout.courier?.provider,
    delivery: checkout.delivery,
    items,
    total: Number(detail?.amount ?? detail?.order?.amount ?? order?.amount ?? 0),
    shipment,
    invoiceUrl: invoice?.url,
    invoiceHandle,
  };
  await redis.set(`receipt:v1:${shortHash(handle)}`, receipt, { ex: OPERATION_TTL });
  return handle;
}

function text(value: unknown, max: number, required = false) {
  if (typeof value !== "string") return required ? null : undefined;
  const clean = value.trim();
  if ((required && !clean) || clean.length > max) return null;
  return clean || undefined;
}

function positiveInt(value: unknown) {
  return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : null;
}

function validateCheckout(body: any): ValidCheckout | CheckoutErrorCode {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "invalidRequest";
  if (Object.keys(body).some((key) => !ALLOWED_KEYS.has(key))) return "unexpectedField";
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) return "invalidItems";

  const seen = new Set<string>();
  const items: ValidCheckout["items"] = [];
  for (const item of body.items) {
    const productId = positiveInt(item?.product_id);
    const unitId = positiveInt(item?.unit_id);
    const qty = positiveInt(item?.qty);
    if (!productId || !unitId || !qty || qty > 99) return "invalidItem";
    const key = `${productId}:${unitId}`;
    if (seen.has(key)) return "duplicateItem";
    seen.add(key);
    items.push({ product_id: productId, unit_id: unitId, qty });
  }

  const deliveryMethod = body.delivery_method;
  if (deliveryMethod !== "PICKUP" && deliveryMethod !== "COURIER") return "invalidDeliveryMethod";
  const payMode = body.pay_mode;
  if (payMode !== "CASH" && payMode !== "BANK_TRANSFER" && payMode !== "RATE") return "invalidPaymentMethod";

  const fullName = text(body.contact?.full_name, 100, true);
  const phone = typeof body.contact?.phone === "string" ? body.contact.phone.replace(/\D/g, "") : "";
  const email = text(body.contact?.email, 255);
  if (!fullName || phone.length < 8 || phone.length > 15 || email === null) return "invalidContact";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "invalidEmail";

  const comment = text(body.comment, 1000);
  if (comment === null) return "commentTooLong";

  if (deliveryMethod === "PICKUP") {
    const warehouseId = positiveInt(body.warehouse_id);
    if (!warehouseId) return "pickupRequired";
    return { items, deliveryMethod, payMode, warehouseId, contact: { full_name: fullName, phone, email }, comment };
  }

  const city = text(body.delivery?.city, 150, true);
  const address = text(body.delivery?.address, 250, true);
  if (!city || !address) return "deliveryAddressRequired";

  const provider = body.courier?.provider as CourierProvider | undefined;
  let courier: CourierInput;
  if (provider === "POSTA_RAPIDA") {
    const regionId = positiveInt(body.courier?.regionId);
    const cityId = positiveInt(body.courier?.cityId);
    const street = text(body.courier?.street, 150, true);
    const block = text(body.courier?.block, 50, true);
    const zipCode = text(body.courier?.zipCode, 20);
    if (!regionId || !cityId || !street || !block || zipCode === null) return "invalidPostaAddress";
    courier = { provider, regionId, cityId, street, block, zipCode };
  } else if (provider === "FANCOURIER") {
    const courierCity = text(body.courier?.city, 150, true);
    const street = text(body.courier?.street, 150, true);
    const postalCode = text(body.courier?.postalCode, 20);
    const number = text(body.courier?.number, 20);
    const building = text(body.courier?.building, 20);
    const apartment = text(body.courier?.apartment, 20);
    if (!courierCity || !street || postalCode === null || number === null || building === null || apartment === null) return "invalidFanAddress";
    courier = { provider, city: courierCity, street, postalCode, number, building, apartment };
  } else {
    return "courierRequired";
  }

  return {
    items,
    deliveryMethod,
    payMode,
    contact: { full_name: fullName, phone, email },
    delivery: { city, address },
    courier,
    comment,
  };
}

async function createShipment(order: any, checkout: ValidCheckout) {
  if (!checkout.courier) return null;

  if (checkout.courier.provider === "FANCOURIER" && order?.fan_courier_awb_no) {
    return { provider: "FANCOURIER", status: "existing", number: String(order.fan_courier_awb_no) };
  }

  const orderId = positiveInt(order?.id);
  const amount = Number(order?.amount);
  if (!orderId || (checkout.payMode === "CASH" && (!Number.isFinite(amount) || amount <= 0))) {
    return { provider: checkout.courier.provider, status: "failed" };
  }
  if (!redis) return { provider: checkout.courier.provider, status: "pending" };

  const key = `shipment:v1:${checkout.courier.provider}:${orderId}`;
  const existing = await redis.get<Record<string, unknown>>(key);
  if (existing) return existing;
  const claimed = await redis.set(key, { provider: checkout.courier.provider, status: "processing" }, { nx: true, ex: OPERATION_TTL });
  if (!claimed) return (await redis.get<Record<string, unknown>>(key)) || { provider: checkout.courier.provider, status: "pending" };

  const cod = checkout.payMode === "CASH" ? amount : 0;
  const orderRef = process.env.DEPLOY_ENV === "staging" ? `STAGING-${orderId}` : String(orderId);

  try {
    const result = checkout.courier.provider === "POSTA_RAPIDA"
      ? await createPostaAwb({
          toName: checkout.contact.full_name,
          toPhone: checkout.contact.phone,
          toEmail: checkout.contact.email,
          regionId: checkout.courier.regionId,
          cityId: checkout.courier.cityId,
          street: checkout.courier.street,
          block: checkout.courier.block,
          zipCode: checkout.courier.zipCode,
          orderRef,
          cod,
        })
      : await createFanCourierAwb({
          toName: checkout.contact.full_name,
          toCity: checkout.courier.city,
          toZipcode: checkout.courier.postalCode,
          toStreet: checkout.courier.street,
          toNr: checkout.courier.number,
          toBl: checkout.courier.building,
          toAp: checkout.courier.apartment,
          toPhone: checkout.contact.phone,
          toEmail: checkout.contact.email,
          orderRef,
          cod,
        });

    const shipment = checkout.courier.provider === "POSTA_RAPIDA"
      ? { provider: checkout.courier.provider, status: "created", number: (result as any).shippingNumber, awb: (result as any).awb }
      : { provider: checkout.courier.provider, status: "created", number: (result as any).awb, trackingUrl: (result as any).trackingUrl };
    await redis.set(key, shipment, { ex: 30 * 24 * 60 * 60 });
    return shipment;
  } catch (error) {
    console.error("[checkout] shipment creation failed", {
      provider: checkout.courier.provider,
      orderId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const failed = { provider: checkout.courier.provider, status: "failed" };
    await redis.set(key, failed, { ex: OPERATION_TTL });
    return failed;
  }
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return errorResponse("requestTooLarge", 413);
  if (!redis && process.env.NODE_ENV === "production") {
    return errorResponse("checkoutUnavailable", 503);
  }

  const idempotencyKey = request.headers.get("idempotency-key") || "";
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(idempotencyKey)) {
    return errorResponse("invalidSession", 400);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse("invalidRequest", 400);
  }
  const checkout = validateCheckout(rawBody);
  if (typeof checkout === "string") return errorResponse(checkout, 400);

  const requestHash = shortHash(JSON.stringify(checkout));
  const operationKey = `checkout:v1:${shortHash(idempotencyKey)}`;
  if (redis) {
    const existing = await redis.get<OperationRecord>(operationKey);
    if (existing?.requestHash !== undefined) {
      if (existing.requestHash !== requestHash) return errorResponse("operationConflict", 409);
      if (existing.state === "completed") return NextResponse.json(existing.response);
      return errorResponse(existing.state === "unknown" ? "orderUnknown" : "alreadyProcessing", existing.state === "unknown" ? 502 : 409);
    }
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const limited = await rateLimit(`rate:checkout:${shortHash(ip)}`, 5, 600);
  if (!limited.allowed) return errorResponse("rateLimited", 429, { "Retry-After": "600" });

  const phoneLimit = await rateLimit(`rate:checkout-phone:${shortHash(checkout.contact.phone)}`, 10, 3600);
  if (!phoneLimit.allowed) return errorResponse("rateLimited", 429);

  if (redis) {
    const claimed = await redis.set(operationKey, { state: "processing", requestHash }, { nx: true, ex: OPERATION_TTL });
    if (!claimed) return errorResponse("alreadyProcessing", 409);
  }

  const paymentMethod = resolvePaymentMethod(checkout.payMode, checkout.deliveryMethod, checkout.courier?.provider);
  const staging = process.env.DEPLOY_ENV === "staging" ? "[STAGING new.adamo.md]" : "";
  const courierNote = checkout.courier
    ? `[CURIER ${checkout.courier.provider}${checkout.payMode === "CASH" ? " RAMBURS" : ""}]`
    : "";
  const payload: CheckoutPayload = {
    items: checkout.items,
    delivery_method: checkout.deliveryMethod,
    payment_method: paymentMethod,
    warehouse_id: checkout.warehouseId,
    contact: checkout.contact,
    delivery: checkout.delivery,
    comment: [staging, courierNote, checkout.comment].filter(Boolean).join(" | ") || undefined,
  };

  if (checkout.payMode === "BANK_TRANSFER") {
    payload.bank_transfer = {
      company_name: ADAMO_COMPANY.name,
      legal_address: ADAMO_COMPANY.legalAddress,
      fiscal_code: ADAMO_COMPANY.regNumber,
      vat_code: ADAMO_COMPANY.vatCode,
      iban: ADAMO_COMPANY.iban,
      bank_code: ADAMO_COMPANY.bic,
    };
  }

  try {
    let responseBody: Record<string, unknown>;

    if (checkout.payMode === "RATE") {
      const data = await crmFetch("/ecommerce/checkout/iute/prepare", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const orderId = data?.merchant_order_id ?? data?.order?.id ?? data?.id;
      responseBody = {
        id: orderId,
        orderId,
        iutePayload: data,
        shipment: checkout.courier ? { provider: checkout.courier.provider, status: "pending_payment" } : null,
      };
    } else {
      const ecommerceToken = request.cookies.get("ecommerceAccessToken")?.value;
      const data = await createOrder(payload, ecommerceToken);
      const orderId = positiveInt(data?.order?.id ?? data?.id ?? data?.orderId);
      if (!orderId) throw new Error("CRM did not return an order ID");

      const shipment = checkout.deliveryMethod === "COURIER"
        ? await createShipment({ ...data?.order, id: orderId }, checkout)
        : null;

      let invoice = null;
      let invoiceHandle: string | undefined;
      if (checkout.payMode === "BANK_TRANSFER" && data?.invoice_access_token) {
        invoiceHandle = randomBytes(32).toString("base64url");
        if (redis) {
          await redis.set(
            `invoice:v1:${shortHash(invoiceHandle)}`,
            { orderId, accessToken: data.invoice_access_token },
            { ex: OPERATION_TTL },
          );
        }
        invoice = await getOrderInvoice(orderId, data.invoice_access_token).catch(() => null);
      }
      let receiptHandle: string | null = null;
      if (!ecommerceToken) {
        try {
          receiptHandle = await createGuestReceipt(orderId, data?.order || data, checkout, shipment, invoice, invoiceHandle);
        } catch (error) {
          console.error("[checkout] guest receipt creation failed", {
            orderId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      responseBody = {
        id: orderId,
        orderId,
        shipment,
        invoice,
        invoiceHandle,
        accountLinked: Boolean(ecommerceToken),
        receiptHandle,
      };
    }

    if (redis) await redis.set(operationKey, { state: "completed", requestHash, response: responseBody }, { ex: OPERATION_TTL });
    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    const crmError = error instanceof CrmApiError ? error : null;
    const definitelyRejected = crmError !== null
      && (crmError.path === "/auth/login" || (crmError.status >= 400 && crmError.status < 500));
    console.error("[checkout] order creation failed", {
      source: crmError ? "crm" : "network",
      status: crmError?.status,
      path: crmError?.path,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    if (redis) {
      if (definitelyRejected) await redis.del(operationKey);
      else await redis.set(operationKey, { state: "unknown", requestHash }, { ex: OPERATION_TTL });
    }
    return crmError?.status === 401 || crmError?.path === "/auth/login"
      ? errorResponse("checkoutUnavailable", 503)
      : errorResponse("orderUnknown", 502);
  }
}
