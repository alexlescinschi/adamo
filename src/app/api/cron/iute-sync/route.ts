import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ponytail: cron safety-net pt IutePay. Webhook poate întârzia/pica.
// Aici NU iterez comenzi (CRM-ul nu expune endpoint listă comenzi IUTE pending public),
// ci returnează ok — când există orderId-uri pending în cache/queue, sync-ul se face.
// Vercel cron lovește endpoint-ul la 5 min; permisiune prin CRON_SECRET.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Marker — codul real de iterare pending-uri se adaugă când CRM expune listă.
  // Webhook-ul asigură marcarea PAID în 99% din cazuri; cron e fallback.
  return NextResponse.json({
    ok: true,
    ts: new Date().toISOString(),
    note: "iute-sync cron placeholder — webhook asigură sync principal",
  });
}
