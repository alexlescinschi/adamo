import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const price = Number(request.nextUrl.searchParams.get("price") || "0");
  if (!price || price <= 0) {
    return NextResponse.json({ error: "Missing price" }, { status: 400 });
  }

  // Smart 0%: 4 luni, 0% dobândă — calcul local, exact, nu ține de Iute.
  const smart = Math.round(price / 4);

  // Flexi Shop (8+ luni, dobândă ~1%): necesită productId real de la Iute
  // pentru fiecare perioadă — nu îl avem încă, deci nu afișăm o sumă inventată.
  // ponytail: flexi rămâne null până primim productId-ul de la Iute Credit.
  return NextResponse.json({ smart, smartPlan: "smart", flexi: null, flexiPlan: "flexi" });
}
