import { NextRequest, NextResponse } from "next/server";
import { refreshCrmToken, CRM_TOKEN_MAX_AGE, CRM_REFRESH_MAX_AGE } from "@/lib/crm-api";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get("ecommerceAccessToken")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    let res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Token expired — try refresh
    if (res.status === 401) {
      const refreshToken = request.cookies.get("ecommerceRefreshToken")?.value;
      if (refreshToken) {
        const refreshed = await refreshCrmToken(refreshToken);
        if (refreshed) {
          res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/profile`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${refreshed.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
          if (res.ok || res.status !== 401) {
            const data = await res.json();
            const response = NextResponse.json(data, { status: res.status });
            if (res.ok) setTokenCookies(response, refreshed);
            return response;
          }
        }
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
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
