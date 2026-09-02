import "server-only";
import { createHash, randomUUID, timingSafeEqual } from "crypto";

const BPAY_MERCHANT_ID = process.env.BPAY_MERCHANT_ID || "";
const BPAY_SECRET_KEY = process.env.BPAY_SECRET_KEY || "";
const BPAY_GATEWAY_URL = process.env.BPAY_GATEWAY_URL || "";

export type BpayInvoiceItem = {
  id: number;
  name: string;
  qty: number;
  sum: number;
};

export type BpayPayment = {
  uuid: string;
  merchantid: string;
  order_id: number;
  amount: number;
  description: string;
  success_url: string;
  fail_url: string;
  callback_url: string;
  currency: number;
  dtime: string;
  params?: { invoice: BpayInvoiceItem[] };
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function bpayDate(date = new Date()) {
  // BPay requires a local calendar timestamp without a timezone suffix.
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 19).replace("T", " ");
}

export function isBpayConfigured() {
  return Boolean(BPAY_MERCHANT_ID && BPAY_SECRET_KEY && BPAY_GATEWAY_URL);
}

export function createBpayPayment(input: Omit<BpayPayment, "uuid" | "merchantid" | "currency" | "dtime">) {
  if (!isBpayConfigured()) throw new Error("BPay is not configured");
  const payment: BpayPayment = {
    ...input,
    uuid: randomUUID(),
    merchantid: BPAY_MERCHANT_ID,
    currency: 498,
    dtime: bpayDate(),
  };
  const data = Buffer.from(JSON.stringify(payment), "utf8").toString("base64");
  return { payment, data, key: sha256(`${data}${BPAY_SECRET_KEY}`), gatewayUrl: BPAY_GATEWAY_URL };
}

export function verifyBpayCallback(data: string, key: string) {
  if (!BPAY_SECRET_KEY || !/^[a-f0-9]{64}$/i.test(key)) return false;
  // BPay documents a different signature scheme for payment notifications.
  const expected = sha256(`${sha256(data)}${sha256(BPAY_SECRET_KEY)}`);
  return timingSafeEqual(Buffer.from(key.toLowerCase()), Buffer.from(expected));
}

export function isBpayMerchant(merchantid: string) {
  return merchantid === BPAY_MERCHANT_ID;
}

export function decodeBpayCallback(data: string) {
  try {
    return JSON.parse(Buffer.from(data, "base64").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}
