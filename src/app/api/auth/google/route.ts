import { NextRequest, NextResponse } from "next/server";
import { createContact, CRM_TOKEN_MAX_AGE, CRM_REFRESH_MAX_AGE } from "@/lib/crm-api";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

export async function POST(request: NextRequest) {
  try {
    const { credential, phone } = await request.json();
    if (!credential) {
      return NextResponse.json({ error: "Missing credential" }, { status: 400 });
    }

    const res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/oauth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: credential }),
    });

    const rawText = await res.text();
    console.error("CRM Google OAuth response:", res.status, rawText.slice(0, 500));
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: `CRM returned non-JSON (${res.status}): ${rawText.slice(0, 200)}` }, { status: 502 });
    }
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const user = data.user || data;
    const userEmail = user.email || data.email || "";
    const firstName = user.first_name || user.name?.split(" ")[0] || "";
    const lastName = user.last_name || user.name?.split(" ").slice(1).join(" ") || "";

    // ponytail: no phone yet → return user data for phone collection step, no cookies
    if (!phone) {
      return NextResponse.json({
        needsPhone: true,
        email: userEmail,
        name: [firstName, lastName].filter(Boolean).join(" ") || user.name || "",
      });
    }

    // Full login: sync CRM contact + set cookies
    // ponytail: createContact after Google OAuth is required because CRM doesn't auto-create contacts
    try {
      await createContact({
        first_name: firstName,
        last_name: lastName,
        phone,
        email: userEmail,
      });
    } catch {
      // Non-critical: contact might already exist or CRM might reject
    }

    const response = NextResponse.json(data);
    if (data.accessToken) {
      response.cookies.set("ecommerceAccessToken", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: CRM_TOKEN_MAX_AGE,
      });
    }
    if (data.refreshToken) {
      response.cookies.set("ecommerceRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: CRM_REFRESH_MAX_AGE,
      });
    }

    return response;
  } catch (error: any) {
    console.error("Google OAuth error:", error?.message || error);
    console.error("Google OAuth stack:", error?.stack);
    return NextResponse.json({ error: "Google authentication failed" }, { status: 500 });
  }
}
