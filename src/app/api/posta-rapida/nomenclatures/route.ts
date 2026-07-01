import { NextRequest, NextResponse } from "next/server";
import { getRegions, getCities, getBlocksForStreet } from "@/lib/posta-rapida";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const regionId = req.nextUrl.searchParams.get("region");
  const cityId = req.nextUrl.searchParams.get("city");
  const streetId = req.nextUrl.searchParams.get("street");
  const search = req.nextUrl.searchParams.get("search") || undefined;

  try {
    if (type === "cities" && regionId) {
      const cities = await getCities(Number(regionId), search);
      return NextResponse.json(cities);
    }
    if (type === "blocks" && cityId && streetId) {
      const blocks = await getBlocksForStreet(Number(cityId), Number(streetId));
      return NextResponse.json(blocks);
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
