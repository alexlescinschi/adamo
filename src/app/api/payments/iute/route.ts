import { NextRequest, NextResponse } from "next/server";
import { createRedirectSession, IUTE_CONFIGURED } from "@/lib/iute-api";

export const dynamic = "force-dynamic";

// ponytail: probe availability — frontend-ul află dacă RATE e activ fără să expună chei.
// GET → { enabled: boolean }
export async function GET() {
  return NextResponse.json({ enabled: IUTE_CONFIGURED });
}

// ponytail: creează IutePay redirect session. Admin key rămâne server-side.
// POST { orderId, items, contact, total, locale } → { redirectUrl, checkoutSessionId }
export async function POST(request: NextRequest) {
  try {
    if (!IUTE_CONFIGURED) {
      return NextResponse.json(
        {
          error:
            "IutePay not configured. Set IUTE_ADMIN_KEY + IUTE_PUBLIC_KEY in env.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { orderId, items, contact, total, locale } = body;

    if (!orderId || !Array.isArray(items) || items.length === 0 || !total) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, items, total" },
        { status: 400 }
      );
    }

    // ponytail: docs IutePay cer phone valid + first/last name mandatory.
    // Validăm aici ca să nu trimitem request sortat spre IutePay pe date incomplete.
    const phoneDigits = String(contact?.phone || "").replace(/[^\d]/g, "");
    const fullName = String(contact?.full_name || "").trim();
    if (phoneDigits.length < 6) {
      return NextResponse.json(
        { error: "Număr de telefon invalid pentru aplicația de credit." },
        { status: 400 }
      );
    }
    if (!fullName) {
      return NextResponse.json(
        { error: "Numele complet este obligatoriu pentru aplicația de credit." },
        { status: 400 }
      );
    }

    const data = await createRedirectSession({
      orderId,
      items,
      contact,
      total,
      locale,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[iute] payment error:", error);
    const message =
      error instanceof Error ? error.message : "IutePay session failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
