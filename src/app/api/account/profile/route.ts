import { NextRequest, NextResponse } from "next/server";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

// ponytail: PATCH profile — name, phone, address. Email is read-only (Google OAuth users).
export async function PATCH(request: NextRequest) {
  const token = request.cookies.get("ecommerceAccessToken")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    const payload: Record<string, string> = {};
    if (body.displayName !== undefined) payload.displayName = body.displayName;
    if (body.phone !== undefined) payload.phone = String(body.phone).replace(/[^\d]/g, "");
    if (body.address !== undefined) payload.address = body.address;

    const res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || "Failed to update profile" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ user: data.user || data });
  } catch (err) {
    console.error("[profile] error:", err);
    return NextResponse.json({ error: "Profile update failed" }, { status: 500 });
  }
}
