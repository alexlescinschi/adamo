import { NextRequest, NextResponse } from "next/server";
import { refreshCrmToken, CRM_TOKEN_MAX_AGE, CRM_REFRESH_MAX_AGE } from "@/lib/crm-api";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("ecommerceAccessToken")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Token expired — try refresh
  if (res.status === 401) {
    const refreshToken = request.cookies.get("ecommerceRefreshToken")?.value;
    if (refreshToken) {
      const refreshed = await refreshCrmToken(refreshToken);
      if (refreshed) {
        res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/me`, {
          headers: { Authorization: `Bearer ${refreshed.accessToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          const response = buildMeResponse(data);
          setTokenCookies(response, refreshed);
          return response;
        }
      }
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: res.status });
  }

  return buildMeResponse(data);
}

// ponytail: single response builder prevents drift between normal & refresh paths
function buildMeResponse(data: any) {
  return NextResponse.json({
    user: data.user || data,
    email: data.user?.email || data.email,
  });
}

function setTokenCookies(response: NextResponse, tokens: { accessToken: string; refreshToken?: string }) {
  response.cookies.set("ecommerceAccessToken", tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CRM_TOKEN_MAX_AGE,
  });
  if (tokens.refreshToken) {
    response.cookies.set("ecommerceRefreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CRM_REFRESH_MAX_AGE,
    });
  }
}
