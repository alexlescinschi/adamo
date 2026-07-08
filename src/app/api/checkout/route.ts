import { NextRequest, NextResponse } from "next/server";
import { createOrder, crmFetch, type CheckoutPayload } from "@/lib/crm-api";
import { ADAMO_COMPANY } from "@/lib/company";

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

    // ponytail: IUTE → CRM /ecommerce/checkout/iute/prepare (order + redirect session).
    // CRM docs: POST /iute/prepare returns EcommerceIuteConfigResponse (addl props).
    // redirectUrl is expected via additionalProperties (not a documented required field).
    if (body.payment_method === "IUTE") {
      const data = await crmFetch("/ecommerce/checkout/iute/prepare", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const redirectUrl = data?.redirect_url || data?.redirectUrl;
      if (!redirectUrl) {
        console.error("[checkout] CRM /iute/prepare missing redirectUrl:", data);
        return NextResponse.json(
          { error: "IutePay este momentan indisponibilă. Încearcă altă metodă de plată." },
          { status: 503 }
        );
      }
      const orderId = data?.order?.id ?? data?.id ?? data?.orderId;
      return NextResponse.json({
        redirectUrl,
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
