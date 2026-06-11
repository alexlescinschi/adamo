import { NextRequest, NextResponse } from "next/server";
import { createOrder, type CheckoutPayload } from "@/lib/crm-api";
import { ADAMO_COMPANY } from "@/lib/company";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const payload: CheckoutPayload = {
      items: body.items,
      delivery_method: body.delivery_method,
      payment_method: body.payment_method,
      warehouse_id: body.warehouse_id,
      contact: body.contact,
      delivery: body.delivery,
      comment: body.comment,
    };

    if (body.payment_method === "BANK_TRANSFER") {
      payload.company_name  = ADAMO_COMPANY.name;
      payload.legal_address = ADAMO_COMPANY.legalAddress;
      payload.fiscal_code   = ADAMO_COMPANY.regNumber;
      payload.vat_code      = ADAMO_COMPANY.vatCode;
      payload.iban          = ADAMO_COMPANY.iban;
      payload.bank_code     = ADAMO_COMPANY.bic;
    }

    console.log("[checkout] payload to CRM:", JSON.stringify(payload));

    const data = await createOrder(payload);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[checkout] error:", error);
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
