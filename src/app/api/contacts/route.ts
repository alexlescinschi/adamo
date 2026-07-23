import { NextRequest, NextResponse } from "next/server";
import { createContact } from "@/lib/crm-api";
import { isRateLimited } from "@/lib/request-security";

export async function POST(req: NextRequest) {
  try {
    const { first_name, last_name, phone, comment } = await req.json();
    const firstName = typeof first_name === "string" ? first_name.trim() : "";
    const lastName = typeof last_name === "string" ? last_name.trim() : "";
    const cleanPhone = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
    const cleanComment = typeof comment === "string" ? comment.trim() : "";
    if (!firstName || firstName.length > 100 || !lastName || lastName.length > 100 || cleanPhone.length < 8 || cleanPhone.length > 15 || cleanComment.length > 1000) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (await isRateLimited(req, "contacts", 3, 3600, cleanPhone)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    await createContact({ first_name: firstName, last_name: lastName, phone: cleanPhone, comment: cleanComment || undefined });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }
}
