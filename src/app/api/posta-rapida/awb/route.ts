import { NextRequest, NextResponse } from "next/server";
import { createPostaAwb } from "@/lib/posta-rapida";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toName, toPhone, toEmail, regionId, cityId, street, block, zipCode, orderRef, cod } = body;

    if (!toName || !toPhone || !regionId || !cityId || !street || !block) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await createPostaAwb({
      toName,
      toPhone,
      toEmail,
      regionId,
      cityId,
      street,
      block,
      zipCode,
      orderRef,
      cod,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[posta-rapida/awb]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AWB creation failed" },
      { status: 500 },
    );
  }
}
