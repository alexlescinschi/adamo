import { NextRequest, NextResponse } from "next/server";
import { getCategories } from "@/lib/crm-api";
import { getCached } from "@/lib/redis";
import { normalizeLocale } from "@/lib/locale";

export async function GET(request: NextRequest) {
  const locale = normalizeLocale(request.nextUrl.searchParams.get("locale") || undefined);
  try {
    const data = await getCached(`categories:${locale}`, () => getCategories(locale), 300);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
