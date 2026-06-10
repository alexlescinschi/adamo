import { NextRequest, NextResponse } from "next/server";
import { createContact } from "@/lib/crm-api";

export async function POST(req: NextRequest) {
  try {
    const { first_name, last_name, phone, comment } = await req.json();
    if (!first_name || !last_name || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    await createContact({ first_name, last_name, phone, notes: comment });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }
}
