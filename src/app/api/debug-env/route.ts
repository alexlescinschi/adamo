import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.N999_API_KEY;
  const phone = process.env.N999_PHONE;
  const allKeys = Object.keys(process.env).filter(k => k.includes("999") || k.includes("API"));
  // ponytail: expune stare IutePay (doar prezența/lungimea, niciodată valoarea).
  const iuteKeys = Object.keys(process.env).filter(k => k.startsWith("IUTE_"));
  return NextResponse.json({
    N999_API_KEY_set: !!key,
    N999_API_KEY_length: key?.length || 0,
    N999_PHONE_set: !!phone,
    matching_env_keys: allKeys,
    node_env: process.env.NODE_ENV,
    // IutePay config presence (fără valori).
    iute_keys: iuteKeys,
    iute_admin_key_set: !!process.env.IUTE_ADMIN_KEY,
    iute_admin_key_length: process.env.IUTE_ADMIN_KEY?.length || 0,
    iute_public_key_set: !!process.env.IUTE_PUBLIC_KEY,
    iute_public_key_length: process.env.IUTE_PUBLIC_KEY?.length || 0,
    iute_base_url: process.env.IUTE_BASE_URL || "(default staging)",
    iute_env: process.env.IUTE_ENV || "(default stage)",
  });
}
