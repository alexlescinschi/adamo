import { NextRequest, NextResponse } from "next/server";
import { getRegions, getCities } from "@/lib/posta-rapida";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const regionId = req.nextUrl.searchParams.get("region");
  const search = req.nextUrl.searchParams.get("search") || undefined;

  try {
    if (type === "cities" && regionId) {
      const cities = await getCities(Number(regionId), search);
      return NextResponse.json(cities);
    }
    const regions = await getRegions(search);
    return NextResponse.json(regions);
  } catch (err) {
    console.error("[posta-rapida/nomenclatures]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Nomenclatures failed" },
      { status: 500 },
    );
  }
}
