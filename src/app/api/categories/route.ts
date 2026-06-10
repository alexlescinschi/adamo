import { NextResponse } from "next/server";
import { getCategories } from "@/lib/crm-api";
import { getCached } from "@/lib/redis";

export async function GET() {
  try {
    const data = await getCached("categories:ro", () => getCategories("ro"), 300);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("API categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
