import { NextRequest, NextResponse } from "next/server";
import { createOrder, type CheckoutPayload } from "@/lib/crm-api";
import { ADAMO_COMPANY } from "@/lib/company";

// ponytail: re-export from crm-api for internal use
// (avoids circular imports by defining locally)
const CRM_BASE = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

async function iutePrepare(payload: CheckoutPayload) {
  const res = await fetch(`${CRM_BASE}/ecommerce/checkout/iute/prepare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecom-category-secret": process.env.ECOM_CATEGORY_WRITE_SECRET || "",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CRM iute/prepare failed ${res.status}: ${text}`);
  }
  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ponytail: CRM expects digits-only phone, strip formatting
    if (body.contact?.phone) {
      body.contact.phone = body.contact.phone.replace(/[^\d]/g, "");
    }

    const payload: CheckoutPayload = {
      items: body.items,
      delivery_method: body.delivery_method,
      payment_method: body.payment_method,
      warehouse_id: body.warehouse_id,
      contact: body.contact,
      delivery: body.delivery,
      comment: body.comment,
    };

    // ponytail: IUTE → CRM /ecommerce/checkout/iute/prepare (order + redirect session)
    if (body.payment_method === "IUTE") {
      const data = await iutePrepare(payload);
      const orderId = data?.order?.id ?? data?.id ?? data?.orderId;
      return NextResponse.json({
        redirectUrl: data.redirectUrl || data.checkout?.url,
        id: orderId,
        orderId,
      }, { status: 201 });
    }

    if (body.payment_method === "BANK_TRANSFER") {
      payload.bank_transfer = {
        company_name:  ADAMO_COMPANY.name,
        legal_address: ADAMO_COMPANY.legalAddress,
        fiscal_code:   ADAMO_COMPANY.regNumber,
        vat_code:      ADAMO_COMPANY.vatCode,
        iban:          ADAMO_COMPANY.iban,
        bank_code:     ADAMO_COMPANY.bic,
      };
    }

    console.log("[checkout] payload to CRM:", JSON.stringify(payload));

    const ecommerceToken = request.cookies.get("ecommerceAccessToken")?.value;
    const data = await createOrder(payload, ecommerceToken);
    // ponytail: CRM întoarce { order: { id }, invoice_access_token }. Frontend-ul citește
    // order.id || order.orderId (top-level) → adăugăm id+orderId top-level pentru compat.
    const orderId = data?.order?.id ?? data?.id ?? data?.orderId;
    return NextResponse.json({ ...data, id: orderId, orderId }, { status: 201 });
  } catch (error) {
    console.error("[checkout] error:", error);
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
