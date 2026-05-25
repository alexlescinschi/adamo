import { NextResponse } from "next/server";
import { getPickupWarehouses } from "@/lib/crm-api";

export async function GET() {
  try {
    const data = await getPickupWarehouses();
    const items = Array.isArray(data) ? data : data?.items || [];
    return NextResponse.json(items);
  } catch (error) {
    console.error("Warehouses error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
