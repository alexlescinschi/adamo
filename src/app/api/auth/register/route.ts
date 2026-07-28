import { NextRequest, NextResponse } from "next/server";
import { createContact, CRM_TOKEN_MAX_AGE, CRM_REFRESH_MAX_AGE } from "@/lib/crm-api";
import { isRateLimited, publicAuthResponse } from "@/lib/request-security";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const firstName = typeof body?.first_name === "string" ? body.first_name.trim() : "";
    const lastName = typeof body?.last_name === "string" ? body.last_name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const cleanPhone = typeof body?.phone === "string" ? body.phone.replace(/[^\d]/g, "") : "";
    if (!firstName || firstName.length > 100 || !lastName || lastName.length > 100 || !email || email.length > 255 || cleanPhone.length < 8 || cleanPhone.length > 15 || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Invalid registration details", code: "invalidRegistration" }, { status: 400 });
    }
    if (await isRateLimited(request, "register", 3, 3600, `${email}:${cleanPhone}`)) {
      return NextResponse.json({ error: "Too many registration attempts", code: "registrationRateLimited" }, { status: 429 });
    }

    const res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, phone: cleanPhone }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      await res.text().catch(() => "");
      if (res.status === 429) {
        return NextResponse.json({ error: "Too many registration attempts", code: "registrationRateLimited" }, { status: res.status });
      }
      if (res.status >= 400 && res.status < 500) {
        return NextResponse.json({ error: "Invalid registration details", code: "invalidRegistration" }, { status: res.status });
      }
      return NextResponse.json({ error: "Registration failed", code: "registrationFailed" }, { status: res.status });
    }

    const data = await res.json();
    try {
      if (!data.user?.contact_id) await createContact({
        first_name: firstName,
        last_name: lastName,
        phone: cleanPhone,
        email,
      });
    } catch (error) {
      console.error("Auth register contact creation error:", error);
    }

    const response = NextResponse.json(publicAuthResponse(data));
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
  } catch (error) {
    console.error("Auth register error:", error);
    return NextResponse.json({ error: "Registration failed", code: "registrationFailed" }, { status: 500 });
  }
}
