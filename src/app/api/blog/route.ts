import { NextRequest, NextResponse } from "next/server";
import { normalizeLocale } from "@/lib/locale";
import { getPaginatedBlogPosts } from "@/lib/sanity";

export async function GET(request: NextRequest) {
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const locale = normalizeLocale(request.nextUrl.searchParams.get("locale") || undefined);

  try {
    return NextResponse.json(await getPaginatedBlogPosts(locale, page));
  } catch {
    return NextResponse.json({ items: [], total: 0, totalPages: 1, page }, { status: 500 });
  }
}
