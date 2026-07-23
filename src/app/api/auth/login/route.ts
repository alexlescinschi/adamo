import { NextRequest, NextResponse } from "next/server";
import { CRM_TOKEN_MAX_AGE, CRM_REFRESH_MAX_AGE } from "@/lib/crm-api";
import { isRateLimited, publicAuthResponse } from "@/lib/request-security";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!email || email.length > 255 || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }
    if (await isRateLimited(request, "login", 10, 600, email)) {
      return NextResponse.json({ error: "Too many login attempts" }, { status: 429 });
    }

    const res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
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
    console.error("Auth login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
