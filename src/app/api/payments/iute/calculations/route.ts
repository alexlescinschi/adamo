import { NextRequest, NextResponse } from "next/server";

const IUTE_BASE = "https://ecom.iutecredit.md";
const CRM_CONFIG_URL = "https://api.crm.adamo.md/v1/ecommerce/checkout/iute/config";

const loanProducts = [
  { id: "b89e31f4-078f-4a3f-969e-445770b83395", months: [4], key: "smart4" },
  { id: "835bac6b-0c4a-4763-9517-73e0e020bfcb", months: [6], key: "smart6" },
  { id: "4d59770d-e72f-41b8-bbf1-78ec27278d76", months: [8, 10, 12, 18, 24, 36], key: "flexi" },
] as const;

type IuteCalculation = {
  period: number;
  monthlyRepayment: number;
  valid: boolean;
};

type IuteProductCalculation = {
  productId: string;
  calculationResults?: IuteCalculation[];
};

export async function GET(request: NextRequest) {
  const price = Number(request.nextUrl.searchParams.get("price") || "0");
  const productId = request.nextUrl.searchParams.get("productId") || "";
  if (!price || price <= 0) {
    return NextResponse.json({ error: "Missing price" }, { status: 400 });
  }
  if (!/^\d+$/.test(productId)) {
    return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
  }

  try {
    const configResponse = await fetch(CRM_CONFIG_URL, { signal: AbortSignal.timeout(5000) });
    const config = await configResponse.json();
    const publicKey = config?.public_api_key;
    if (!configResponse.ok || !publicKey) throw new Error("IutePay is not configured");

    const response = await fetch(`${IUTE_BASE}/api/v1/eshop/client/eshop-product/-/calculation?periodBatch=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-iute-api-key": publicKey,
      },
      body: JSON.stringify({
        // The real product ID is also the Iute SKU used for future loan-product mappings.
        items: [{ id: productId, sku: productId, amount: price }],
        periods: loanProducts.map(({ id, months }) => ({ productId: id, months })),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("IutePay calculation failed");

    const results: IuteProductCalculation[] = await response.json();
    const monthlyPayment = (productKey: string, period: number) => {
      const product = loanProducts.find(({ key }) => key === productKey);
      return results
        .find((result) => result.productId === product?.id)
        ?.calculationResults?.find((result) => result.period === period && result.valid)
        ?.monthlyRepayment ?? null;
    };

    const smart4 = monthlyPayment("smart4", 4);
    const smart6 = monthlyPayment("smart6", 6);
    const flexi = monthlyPayment("flexi", 36);
    const plans = [
      { months: 4, monthlyPayment: smart4, kind: "smart" },
      { months: 6, monthlyPayment: smart6, kind: "smart" },
      ...[8, 10, 12, 18, 24, 36].map((months) => ({ months, monthlyPayment: monthlyPayment("flexi", months), kind: "flexi" })),
    ].filter((plan): plan is { months: number; monthlyPayment: number; kind: "smart" | "flexi" } => plan.monthlyPayment !== null);

    return NextResponse.json({ smart4, smart6, flexi, plans });
  } catch {
    return NextResponse.json({ error: "IutePay calculations are unavailable" }, { status: 503 });
  }
}
