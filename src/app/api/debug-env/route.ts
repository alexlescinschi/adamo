import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.N999_API_KEY;
  const phone = process.env.N999_PHONE;
  const allKeys = Object.keys(process.env).filter(k => k.includes("999") || k.includes("API"));
  // ponytail: IutePay config e acum exclusiv în CRM. Verificăm răspunsul real.
  let iuteCrmConfig = null;
  try {
    const { crmFetch } = await import("@/lib/crm-api");
    iuteCrmConfig = await crmFetch("/ecommerce/checkout/iute/config", {
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    iuteCrmConfig = { error: "CRM unreachable" };
  }
  return NextResponse.json({
    N999_API_KEY_set: !!key,
    N999_API_KEY_length: key?.length || 0,
    N999_PHONE_set: !!phone,
    matching_env_keys: allKeys,
    node_env: process.env.NODE_ENV,
    iute_crm_config: iuteCrmConfig,
  });
}
