// Centralized mapping between the checkout UI state and the CRM
// `payment_method` value. The checkout endpoint accepts only:
//   ONLINE, BANK_TRANSFER, IUTE, FAN_COURIER_RAMBUS, COURIER_RAMBURS, MICROINVEST
// (CASH/CARD exist in the wider deal enum but are rejected at checkout.)

export type CourierProvider = "FANCOURIER" | "POSTA_RAPIDA";

export type CrmPaymentMethod =
  | "ONLINE"
  | "BANK_TRANSFER"
  | "IUTE"
  | "FAN_COURIER_RAMBUS"
  | "COURIER_RAMBURS"
  | "MICROINVEST";

export const PAYMENT_METHOD = {
  ONLINE: "ONLINE",
  BANK_TRANSFER: "BANK_TRANSFER",
  IUTE: "IUTE",
  FAN_COURIER_RAMBUS: "FAN_COURIER_RAMBUS",
  COURIER_RAMBURS: "COURIER_RAMBURS",
} as const satisfies Record<string, CrmPaymentMethod>;

// payMode = UI selection ("Plată la livrare" vs "Transfer bancar" vs "Rate IutePay").
// - BANK_TRANSFER: same regardless of delivery.
// - RATE (IutePay BNPL): payment_method=IUTE, redirect la IutePay după creare order.
// - CASH: FAN uses FAN_COURIER_RAMBUS; Curier Rapid uses COURIER_RAMBURS;
//   pickup is paid in-store and uses the CRM's documented ONLINE value.
export function resolvePaymentMethod(
  payMode: "CASH" | "BANK_TRANSFER" | "RATE" | "BPAY",
  deliveryMethod: "PICKUP" | "COURIER",
  courierProvider?: CourierProvider,
): CrmPaymentMethod {
  if (payMode === "BANK_TRANSFER") return PAYMENT_METHOD.BANK_TRANSFER;
  if (payMode === "RATE") return PAYMENT_METHOD.IUTE;
  if (payMode === "BPAY") return PAYMENT_METHOD.ONLINE;
  if (deliveryMethod !== "COURIER") return PAYMENT_METHOD.ONLINE;
  return courierProvider === "POSTA_RAPIDA"
    ? PAYMENT_METHOD.COURIER_RAMBURS
    : PAYMENT_METHOD.FAN_COURIER_RAMBUS;
}
