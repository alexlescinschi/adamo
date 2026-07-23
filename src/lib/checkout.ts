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
// - CASH: FAN uses FAN_COURIER_RAMBUS. CRM has no Poșta COD enum, so Poșta and
//   pickup use ONLINE to avoid an automatic FAN AWB; checkout adds an explicit
//   [CURIER POSTA_RAPIDA RAMBURS] note. ponytail: replace when CRM adds Poșta COD.
export function resolvePaymentMethod(
  payMode: "CASH" | "BANK_TRANSFER" | "RATE",
  deliveryMethod: "PICKUP" | "COURIER",
  courierProvider?: CourierProvider,
): CrmPaymentMethod {
  if (payMode === "BANK_TRANSFER") return PAYMENT_METHOD.BANK_TRANSFER;
  if (payMode === "RATE") return PAYMENT_METHOD.IUTE;
  return deliveryMethod === "COURIER" && courierProvider === "FANCOURIER"
    ? PAYMENT_METHOD.FAN_COURIER_RAMBUS
    : PAYMENT_METHOD.ONLINE;
}
