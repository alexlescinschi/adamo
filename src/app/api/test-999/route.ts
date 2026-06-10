import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test 1: No auth at all
    const r1 = await fetch("https://partners-api.999.md/categories?lang=ro");
    const t1 = await r1.text();

    // Test 2: With auth
    const key = process.env.N999_API_KEY || "";
    const r2 = await fetch("https://partners-api.999.md/cash", {
      headers: { Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}` },
    });
    const t2 = await r2.text();

    // Test 3: Simple GET with auth to categories
    const r3 = await fetch("https://partners-api.999.md/categories?lang=ro", {
      headers: { Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}` },
    });
    const t3 = await r3.text();

    return NextResponse.json({
      no_auth: { status: r1.status, body: t1.substring(0, 100) },
      cash_with_auth: { status: r2.status, body: t2.substring(0, 100) },
      categories_with_auth: { status: r3.status, body: t3.substring(0, 100) },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
