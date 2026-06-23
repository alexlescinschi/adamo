import { NextRequest, NextResponse } from "next/server";

// ponytail: CRM /oauth/google e blocat (env var GOOGLE_CLIENT_ID lipsă pe serverul CRM).
// Google devine doar verificare email + pre-completare nume; userul alege parolă.
// Token-ul real vine de la /register sau /login, nu de aici.
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

    const { email, email_verified, given_name, family_name, name } = payload;
    if (!email || !email_verified) {
      return NextResponse.json({ error: "Email negăsit sau neverificat" }, { status: 400 });
    }

    return NextResponse.json({
      email,
      firstName: given_name || name?.split(" ")[0] || "",
      lastName: family_name || name?.split(" ").slice(1).join(" ") || "",
    });
  } catch (error) {
    console.error("Google token verify error:", error);
    return NextResponse.json({ error: "Google authentication failed" }, { status: 500 });
  }
}
