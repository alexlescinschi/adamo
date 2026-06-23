import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("ecommerceAccessToken", "", { maxAge: 0, path: "/" });
  response.cookies.set("ecommerceRefreshToken", "", { maxAge: 0, path: "/" });
  return response;
}
