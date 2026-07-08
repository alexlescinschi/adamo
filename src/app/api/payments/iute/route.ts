import { NextResponse } from "next/server";
import { IUTE_CONFIGURED } from "@/lib/iute-api";

// ponytail: IutePay availability probe. CRM handles everything else.
// GET → { enabled: boolean } — frontend shows RATE option when true.
export async function GET() {
  return NextResponse.json({ enabled: IUTE_CONFIGURED });
}
