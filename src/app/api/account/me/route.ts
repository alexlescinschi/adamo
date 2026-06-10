import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";
const JWT_SECRET = process.env.GOOGLE_JWT_SECRET || "adamo-google-jwt-fallback";

function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature !== expected) return null;
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const crmToken = request.cookies.get("ecommerceAccessToken")?.value;
  const googleToken = request.cookies.get("googleAccessToken")?.value;

  if (crmToken) {
    try {
      const res = await fetch(`${CRM_BASE_URL}/ecommerce/e-commerce-auth/me`, {
        headers: { Authorization: `Bearer ${crmToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        return NextResponse.json({
          user: data.user || data,
          email: data.user?.email || data.email,
        });
      }
    } catch {}
  }

  if (googleToken) {
    const data = verifyToken(googleToken);
    if (data && data.email) {
      return NextResponse.json({
        user: { email: data.email, name: data.name },
        email: data.email,
        provider: "google",
      });
    }
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
