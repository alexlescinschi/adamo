import { NextResponse } from "next/server";
import { crmFetch } from "@/lib/crm-api";

// ponytail: IutePay availability from CRM (source of truth).
// CRM endpoint: GET /ecommerce/checkout/iute/config → { enabled, merchant }
// GET → { enabled: boolean } — frontend shows RATE option when true.
export async function GET() {
  try {
    const data = await crmFetch("/ecommerce/checkout/iute/config", {
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json({
      enabled: data?.enabled ?? false,
    });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
