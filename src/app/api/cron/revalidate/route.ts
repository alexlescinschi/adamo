import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

// Called by Vercel Cron every 5 minutes — revalidates homepage and category pages.
// Product pages use revalidate=60 + generateStaticParams, so they don't need explicit cron.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidatePath("/");
  revalidatePath("/minipc");
  revalidatePath("/laptopuri");

  return NextResponse.json({
    ok: true,
    revalidated: ["/", "/minipc", "/laptopuri"],
    ts: new Date().toISOString(),
  });
}
