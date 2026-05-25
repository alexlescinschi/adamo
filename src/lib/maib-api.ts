import "server-only";

const MAIB_API_URL = process.env.MAIB_API_URL || "https://api.maibmerchants.md/v1";
const MAIB_MERCHANT_ID = process.env.MAIB_MERCHANT_ID || "";
const MAIB_API_KEY = process.env.MAIB_API_KEY || "";

interface MaibPaymentRequest {
  amount: number;
  currency: "MDL";
  description: string;
  orderId: string;
  redirectUrl: string;
  callbackUrl: string;
}

interface MaibPaymentResponse {
  payId: string;
  paymentUrl: string;
}

export async function createPayment(request: MaibPaymentRequest): Promise<MaibPaymentResponse> {
  const res = await fetch(`${MAIB_API_URL}/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MAIB_API_KEY}`,
    },
    body: JSON.stringify({
      merchantId: MAIB_MERCHANT_ID,
      amount: request.amount,
      currency: request.currency,
      description: request.description,
      orderId: request.orderId,
      redirectUrl: request.redirectUrl,
      callbackUrl: request.callbackUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Maib payment error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getPaymentInfo(payId: string) {
  const res = await fetch(`${MAIB_API_URL}/pay-info/${payId}`, {
    headers: {
      Authorization: `Bearer ${MAIB_API_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Maib payment info error ${res.status}: ${text}`);
  }

  return res.json();
}
