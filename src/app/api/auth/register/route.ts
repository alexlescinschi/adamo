import { NextRequest, NextResponse } from "next/server";
import { createContact, CRM_TOKEN_MAX_AGE, CRM_REFRESH_MAX_AGE } from "@/lib/crm-api";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    try {
      await createContact({
        first_name: body.first_name,
        last_name: body.last_name,
        phone: body.phone,
        email: body.email,
      });
    } catch {
      // Non-critical: contact creation failure shouldn't block registration
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
  } catch (error) {
    console.error("Auth register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
