import { NextRequest, NextResponse } from "next/server";
import { createContact } from "@/lib/crm-api";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

export async function POST(request: NextRequest) {
  try {
    const { phone, firstName, lastName, email } = await request.json();
    console.error("[google/phone] received:", { phone, firstName, lastName, email });
    if (!phone) {
      return NextResponse.json({ error: "Missing phone" }, { status: 400 });
    }

    const token = request.cookies.get("ecommerceAccessToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/phone`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ phone }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[google/phone] CRM error:", res.status, err);
      return NextResponse.json(
        { error: err.message || err.error || "Failed to set phone" },
        { status: res.status },
      );
    }

    // ponytail: create CRM contact immediately so user appears in contacts list (same pattern as register)
    let contactWarning: string | undefined;
    try {
      const contactResult = await createContact({
        first_name: firstName || "",
        last_name: lastName || "",
        phone,
        email: email || undefined,
      });
      console.error("[google/phone] createContact OK:", JSON.stringify(contactResult).slice(0, 200));
    } catch (err) {
      console.error("[google/phone] createContact failed:", err);
      contactWarning = "Contact creation failed — user authenticated but not in CRM contacts";
    }

    return NextResponse.json({ success: true, contactWarning });
  } catch (error: any) {
    console.error("[google/phone]", error?.message || error);
    return NextResponse.json({ error: "Failed to set phone" }, { status: 500 });
  }
}
