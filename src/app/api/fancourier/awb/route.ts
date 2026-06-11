import { NextRequest, NextResponse } from "next/server";
import { createFanCourierAwb } from "@/lib/fancourier";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toName, toCity, toZipcode, toPhone, toEmail, orderRef, cod } = body;

    if (!toName || !toCity || !toPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await createFanCourierAwb({
      toName,
      toCity,
      toZipcode: toZipcode || "2000",
      toPhone,
      toEmail,
      orderRef,
      cod,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[fancourier/awb]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AWB creation failed" },
      { status: 500 }
    );
  }
}
