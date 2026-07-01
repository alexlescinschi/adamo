import { NextRequest, NextResponse } from "next/server";
import { getPostaTariff } from "@/lib/posta-rapida";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { regionId, cityId, street, cod } = body;

    if (!regionId || !cityId || !street) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await getPostaTariff({
      toName: ".",
      toPhone: ".",
      regionId,
      cityId,
      street,
      block: ".",
      cod,
    });

    return NextResponse.json(result ?? { cost: 0, estimatedDays: 0 });
  } catch (err) {
    console.error("[posta-rapida/tariff]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Tariff calculation failed" },
      { status: 500 },
    );
  }
}
