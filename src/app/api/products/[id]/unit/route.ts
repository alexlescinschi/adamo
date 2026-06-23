import { NextRequest, NextResponse } from "next/server";

// ponytail: endpoint-urile CRM de LISTĂ nu returnează unit_id (doar DETAIL).
// Acest endpoint scote unit_id real pentru add-to-cart de pe paginile de listă.
const CRM_BASE_URL = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const res = await fetch(`${CRM_BASE_URL}/ecommerce/products/${id}`, {
      next: { revalidate: 3600 }, // cache 1h — unit_id-ul nu se schimbă frecvent
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const data = await res.json();
    const unitId =
      data.units?.[0]?.id ?? data.offerSummary?.priceTiers?.[0]?.representativeUnitId ?? data.id;
    return NextResponse.json({ unit_id: unitId });
  } catch (error) {
    console.error("Resolve unit error:", error);
    return NextResponse.json({ error: "Failed to resolve unit" }, { status: 500 });
  }
}
