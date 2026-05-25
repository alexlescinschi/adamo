import { NextRequest, NextResponse } from "next/server";
import { getCategoryBySlug } from "@/lib/crm-api";
import { getCached } from "@/lib/redis";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get("locale") || "ro";

  try {
    const cacheKey = `category:${slug}:${locale}`;
    const data = await getCached(cacheKey, () => getCategoryBySlug(slug, locale), 300);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API category error:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}
