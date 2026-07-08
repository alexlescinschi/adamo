import { NextResponse } from "next/server";
import { IUTE_CONFIGURED } from "@/lib/iute-api";
import { crmFetch } from "@/lib/crm-api";

// ponytail: IutePay availability probe from CRM (source of truth) + env fallback.
// CRM endpoint: GET /ecommerce/checkout/iute/config → { enabled, merchant }
// GET → { enabled: boolean } — frontend shows RATE option when true.
export async function GET() {
  try {
    // Source of truth: CRM's IutePay config
    const data = await crmFetch("/ecommerce/checkout/iute/config", {
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json({
      enabled: data?.enabled ?? IUTE_CONFIGURED,
    });
  } catch {
    // CRM unreachable → fallback to local env
    return NextResponse.json({ enabled: IUTE_CONFIGURED });
  }
}
