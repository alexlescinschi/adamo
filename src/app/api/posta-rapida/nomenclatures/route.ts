import { NextRequest, NextResponse } from "next/server";
import { getRegions, getCities, getBlocksForStreet, getStreets } from "@/lib/posta-rapida";
import { isRateLimited } from "@/lib/request-security";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const regionId = req.nextUrl.searchParams.get("region");
  const cityId = req.nextUrl.searchParams.get("city");
  const streetId = req.nextUrl.searchParams.get("street");
  const rawSearch = req.nextUrl.searchParams.get("search") || "";
  const search = rawSearch.trim().slice(0, 100) || undefined;

  if (await isRateLimited(req, "posta-nomenclatures", 120, 60)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const region = Number(regionId);
    const city = Number(cityId);
    const street = Number(streetId);
    if (type === "cities" && Number.isSafeInteger(region) && region > 0) {
      const cities = await getCities(region, search);
      return NextResponse.json(cities);
    }
    if (type === "streets" && Number.isSafeInteger(city) && city > 0) {
      const streets = await getStreets(city, search);
      return NextResponse.json(streets);
    }
    if (type === "blocks" && Number.isSafeInteger(city) && city > 0 && Number.isSafeInteger(street) && street > 0) {
      const blocks = await getBlocksForStreet(city, street);
      return NextResponse.json(blocks);
    }
    const regions = await getRegions(search);
    return NextResponse.json(regions);
  } catch {
    return NextResponse.json({ error: "Nomenclatures failed" }, { status: 502 });
  }
}
