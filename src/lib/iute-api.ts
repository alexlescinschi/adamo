// ponytail: IutePay (IuteCredit) BNPL — config for frontend SDK only.
// CRM handles IutePay session creation + webhooks via its own endpoints.
// ADAMO just loads iutepay.js in browser and redirects to IutePay URL from CRM.

const IUTE_BASE_URL =
  process.env.IUTE_BASE_URL || "https://ecom-stage.iutecredit.md";
const IUTE_PUBLIC_KEY = process.env.IUTE_PUBLIC_KEY || "";
const IUTE_LANG = process.env.IUTE_LANG || "ro";

export const IUTE_CONFIGURED = Boolean(IUTE_PUBLIC_KEY);
export const IUTE_PUBLIC_KEY_BROWSER = IUTE_PUBLIC_KEY;
export const IUTE_LANG_BROWSER = IUTE_LANG;
export const IUTE_SCRIPT_URL = `${IUTE_BASE_URL}/iutepay.js`;
export const IUTE_STYLE_URL = `${IUTE_BASE_URL}/iutepay.css`;
