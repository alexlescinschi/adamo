import { NextRequest, NextResponse } from "next/server";
import { CRM_TOKEN_MAX_AGE, CRM_REFRESH_MAX_AGE } from "@/lib/crm-api";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json();
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

    const needsPhone = !user.phone && !user.contact_id;
    const responseBody: Record<string, unknown> = needsPhone
      ? {
          needsPhone: true,
          email: userEmail,
          name: [firstName, lastName].filter(Boolean).join(" ") || user.name || "",
        }
      : data;

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
  } catch (error: any) {
    console.error("Google OAuth error:", error?.message || error);
    console.error("Google OAuth stack:", error?.stack);
    return NextResponse.json({ error: "Google authentication failed" }, { status: 500 });
  }
}
