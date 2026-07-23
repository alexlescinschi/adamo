import { NextRequest, NextResponse } from "next/server";
import { createContact } from "@/lib/crm-api";
import { isRateLimited } from "@/lib/request-security";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = typeof body?.phone === "string" ? body.phone.replace(/[^\d]/g, "") : "";
    if (phone.length < 8 || phone.length > 15) return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    if (await isRateLimited(request, "google-phone-ip", 10, 600)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const token = request.cookies.get("ecommerceAccessToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (await isRateLimited(request, "google-phone-user", 10, 600, `${token.slice(-64)}:${phone}`)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/phone`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ phone }),
      signal: AbortSignal.timeout(8000),
    });

    const updated = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: updated.message || updated.error || "Failed to set phone" },
        { status: res.status },
      );
    }

    // ponytail: create CRM contact immediately so user appears in contacts list (same pattern as register)
    let contactWarning: string | undefined;
    try {
      const user = updated.user || updated;
      const displayName = String(user.username || user.name || "").trim();
      const firstName = String(user.first_name || displayName.split(/\s+/)[0] || "").slice(0, 100);
      const lastName = String(user.last_name || displayName.split(/\s+/).slice(1).join(" ") || "").slice(0, 100);
      const email = typeof user.email === "string" ? user.email.slice(0, 255) : undefined;
      if (!user.contact_id && (firstName || lastName || email)) {
        await createContact({ first_name: firstName, last_name: lastName, phone, email });
      }
    } catch {
      contactWarning = "Contact creation failed — user authenticated but not in CRM contacts";
    }

    return NextResponse.json({ success: true, contactWarning });
  } catch {
    return NextResponse.json({ error: "Failed to set phone" }, { status: 500 });
  }
}
