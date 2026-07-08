import { NextResponse } from "next/server";
import { IUTE_CONFIGURED } from "@/lib/iute-api";

const ECOM_TOKEN = process.env.ECOM_CATEGORY_WRITE_SECRET || "";

// ponytail: probe availability + IutePay public config from CRM.
// GET → { enabled, merchant } — frontend uses enabled to show RATE option.
export async function GET() {
  try {
    // Try CRM's IutePay config endpoint first for richer data
    if (ECOM_TOKEN) {
      try {
        const crmRes = await fetch("https://api.crm.adamo.md/v1/ecommerce/checkout/iute/config", {
          headers: { "x-ecom-category-secret": ECOM_TOKEN },
          signal: AbortSignal.timeout(5000),
        });
        if (crmRes.ok) {
          const data = await crmRes.json();
          return NextResponse.json({
            enabled: Boolean(data?.enabled ?? IUTE_CONFIGURED),
            ...(data?.merchant ? { merchant: data.merchant } : {}),
          });
        }
      } catch {
        // fallback to local config
      }
    }
    return NextResponse.json({ enabled: IUTE_CONFIGURED });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
