import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createContact } from "@/lib/crm-api";

const JWT_SECRET = process.env.GOOGLE_JWT_SECRET || "adamo-google-jwt-fallback";
const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

function signToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

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

    try {
      await createContact({ first_name: firstName, last_name: lastName, phone: "", email });
    } catch {}

    const token = signToken({ email, name: `${firstName} ${lastName}`.trim(), provider: "google" });

    const response = NextResponse.json({ success: true });
    response.cookies.set("googleAccessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json({ error: "Google authentication failed" }, { status: 500 });
  }
}
