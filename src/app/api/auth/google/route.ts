import { NextRequest, NextResponse } from "next/server";
import { CRM_TOKEN_MAX_AGE, CRM_REFRESH_MAX_AGE } from "@/lib/crm-api";
import { isRateLimited, publicAuthResponse } from "@/lib/request-security";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const credential = typeof body?.credential === "string" ? body.credential : "";
    if (credential.length < 100 || credential.length > 10_000) {
      return NextResponse.json({ error: "Missing credential", code: "googleLoginFailed" }, { status: 400 });
    }
    if (await isRateLimited(request, "google-auth", 10, 600, credential.slice(-64))) {
      return NextResponse.json({ error: "Too many login attempts", code: "loginRateLimited" }, { status: 429 });
    }

    const res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/oauth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: credential }),
      signal: AbortSignal.timeout(8000),
    });

    const rawText = await res.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Google authentication failed", code: "googleLoginFailed" }, { status: 502 });
    }
    if (!res.ok) {
      if (res.status === 429) {
        return NextResponse.json({ error: "Too many login attempts", code: "loginRateLimited" }, { status: res.status });
      }
      return NextResponse.json({ error: "Google authentication failed", code: "googleLoginFailed" }, { status: res.status });
    }

    const user = data.user || data;
    const userEmail = user.email || data.email || "";
    const displayName = user.first_name || user.username || user.name || "";
    const firstName = displayName.split(" ")[0] || "";
    const lastName = displayName.split(" ").slice(1).join(" ") || "";

    const needsPhone = !user.phone && !user.contact_id;
    const responseBody: Record<string, unknown> = needsPhone
      ? {
          needsPhone: true,
          email: userEmail,
          name: [firstName, lastName].filter(Boolean).join(" ") || user.name || "",
        }
      : publicAuthResponse(data);

    const response = NextResponse.json(responseBody);

    // ponytail: always set cookies — user is authenticated via CRM OAuth
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
  } catch {
    return NextResponse.json({ error: "Google authentication failed", code: "googleLoginFailed" }, { status: 500 });
  }
}
