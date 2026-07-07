// Centralized mapping between the checkout UI state and the CRM
// `payment_method` value. The checkout endpoint accepts only:
//   ONLINE, BANK_TRANSFER, IUTE, FAN_COURIER_RAMBUS, MICROINVEST
// (CASH/CARD exist in the wider deal enum but are rejected at checkout.)

export type CourierProvider = "FANCOURIER" | "POSTA_RAPIDA";

export type CrmPaymentMethod =
  | "ONLINE"
  | "BANK_TRANSFER"
  | "IUTE"
  | "FAN_COURIER_RAMBUS"
  | "MICROINVEST";

export const PAYMENT_METHOD = {
  ONLINE: "ONLINE",
  BANK_TRANSFER: "BANK_TRANSFER",
  IUTE: "IUTE",
  FAN_COURIER_RAMBUS: "FAN_COURIER_RAMBUS",
} as const satisfies Record<string, CrmPaymentMethod>;

// payMode = UI selection ("Plată la livrare" vs "Transfer bancar" vs "Rate IutePay").
// - BANK_TRANSFER: same regardless of delivery.
// - RATE (IutePay BNPL): payment_method=IUTE, redirect la IutePay după creare order.
// - CASH: ramburs by courier (FAN_COURIER_RAMBUS); at pickup the order is
//   created and paid in-store, CRM uses ONLINE as the documented PICKUP value
//   (spec example "Pickup + online payment"). ponytail: ONLINE = placeholder,
//   no real online charge happens at pickup.
export function resolvePaymentMethod(
  payMode: "CASH" | "BANK_TRANSFER" | "RATE",
  deliveryMethod: "PICKUP" | "COURIER"
): CrmPaymentMethod {
  if (payMode === "BANK_TRANSFER") return PAYMENT_METHOD.BANK_TRANSFER;
  if (payMode === "RATE") return PAYMENT_METHOD.IUTE;
  return deliveryMethod === "COURIER"
    ? PAYMENT_METHOD.FAN_COURIER_RAMBUS
    : PAYMENT_METHOD.ONLINE;
}
