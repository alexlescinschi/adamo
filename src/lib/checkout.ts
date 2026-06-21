// Centralized mapping between the checkout UI state and the CRM
// `payment_method` value. The full list of accepted values comes from the
// official CRM documentation (api.crm.adamo.md):
//   CASH, CARD, MICROINVEST, IUTE, BANK_TRANSFER, CASH_DOP_NO,
//   CASH_INVOICE, CARD_INVOICE, ONLINE, FAN_COURIER_RAMBUS

// All payment_method values accepted by the CRM.
export type CrmPaymentMethod =
  | "CASH"
  | "CARD"
  | "MICROINVEST"
  | "IUTE"
  | "BANK_TRANSFER"
  | "CASH_DOP_NO"
  | "CASH_INVOICE"
  | "CARD_INVOICE"
  | "ONLINE"
  | "FAN_COURIER_RAMBUS";

// The subset actually used by this storefront.
export const PAYMENT_METHOD = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  FAN_COURIER_RAMBUS: "FAN_COURIER_RAMBUS",
} as const satisfies Record<string, CrmPaymentMethod>;

// `payMode` is the UI selection ("Plată la livrare" vs "Transfer bancar").
// `deliveryMethod` decides HOW cash is collected: ramburs by courier vs. cash
// on pickup. Online card payment is not yet enabled in the UI.
export function resolvePaymentMethod(
  payMode: "CASH" | "BANK_TRANSFER",
  deliveryMethod: "PICKUP" | "COURIER"
): CrmPaymentMethod {
  if (payMode === "BANK_TRANSFER") return PAYMENT_METHOD.BANK_TRANSFER;
  // CASH: collect by courier (ramburs) vs. pay on pickup.
  return deliveryMethod === "COURIER"
    ? PAYMENT_METHOD.FAN_COURIER_RAMBUS
    : PAYMENT_METHOD.CASH;
}
