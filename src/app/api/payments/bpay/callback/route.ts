import { NextRequest, NextResponse } from "next/server";
import { decodeBpayCallback, isBpayMerchant, verifyBpayCallback } from "@/lib/bpay";
import { redis } from "@/lib/redis";

type BpayIntent = {
  orderId: number;
  uuid: string;
  amount: number;
  state: "pending" | "paid";
  receiptNumber?: string;
};

const OK = { code: 100, text: "success" };
const RETRY = { code: 30, text: "temporary processing error" };

export async function POST(request: NextRequest) {
  if (!redis) return NextResponse.json(RETRY, { status: 503 });

  let data = "";
  let key = "";
  try {
    if ((request.headers.get("content-type") || "").includes("application/json")) {
      const body = await request.json();
      data = typeof body?.data === "string" ? body.data : "";
      key = typeof body?.key === "string" ? body.key : "";
    } else {
      const body = await request.formData();
      data = String(body.get("data") || "");
      key = String(body.get("key") || "");
    }
  } catch {
    return NextResponse.json(RETRY, { status: 400 });
  }

  if (!verifyBpayCallback(data, key)) return NextResponse.json(RETRY, { status: 400 });
  const callback = decodeBpayCallback(data);
  const uuid = typeof callback?.uuid === "string" ? callback.uuid : "";
  const orderId = Number(callback?.order_id);
  const amount = Number(callback?.amount);
  const currency = Number(callback?.currency);
  const merchantid = typeof callback?.merchantid === "string" ? callback.merchantid : "";
  if (!uuid || !Number.isSafeInteger(orderId) || !Number.isFinite(amount) || currency !== 498 || callback?.comand !== "pay" || !isBpayMerchant(merchantid)) {
    return NextResponse.json(RETRY, { status: 400 });
  }

  const intentKey = `bpay:v1:${uuid}`;
  const intent = await redis.get<BpayIntent>(intentKey);
  if (!intent || intent.orderId !== orderId || intent.uuid !== uuid || Math.abs(intent.amount - amount) > 0.005) {
    return NextResponse.json(RETRY, { status: 400 });
  }
  if (intent.state === "paid") return NextResponse.json(OK);

  await redis.set(intentKey, { ...intent, state: "paid", receiptNumber: String(callback?.receipt || "") }, { ex: 30 * 24 * 60 * 60 });
  return NextResponse.json(OK);
}
