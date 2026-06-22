import { NextRequest, NextResponse } from "next/server";
import { CRM_TOKEN_MAX_AGE, CRM_REFRESH_MAX_AGE } from "@/lib/crm-api";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json();
    if (!credential) {
      return NextResponse.json({ error: "Missing credential" }, { status: 400 });
    }

    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!verifyRes.ok) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
    }

    const payload = await verifyRes.json();
    if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: "Token audience mismatch" }, { status: 401 });
    }

    const { email, given_name, family_name, name } = payload;
    const firstName = given_name || name?.split(" ")[0] || "";
    const lastName = family_name || name?.split(" ").slice(1).join(" ") || "";

    let crmRes: Response;
    try {
      crmRes = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/oauth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credential }),
      });
    } catch (err) {
      console.error("CRM OAuth call failed:", err);
      return NextResponse.json({ error: "CRM authentication unavailable" }, { status: 502 });
    }

    if (!crmRes.ok) {
      const crmErr = await crmRes.text().catch(() => "unknown");
      console.error("CRM OAuth rejected:", crmRes.status, crmErr);
      return NextResponse.json({ error: "CRM authentication failed" }, { status: crmRes.status });
    }

    const crmData = await crmRes.json();
    if (!crmData.accessToken) {
      console.error("CRM OAuth returned no accessToken:", JSON.stringify(crmData));
      return NextResponse.json({ error: "CRM authentication failed — no token returned" }, { status: 502 });
    }

    const response = NextResponse.json({ success: true, user: crmData.user });
    response.cookies.set("ecommerceAccessToken", crmData.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CRM_TOKEN_MAX_AGE,
    });
    if (crmData.refreshToken) {
      response.cookies.set("ecommerceRefreshToken", crmData.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: CRM_REFRESH_MAX_AGE,
      });
    }

    return response;
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json({ error: "Google authentication failed" }, { status: 500 });
  }
}
