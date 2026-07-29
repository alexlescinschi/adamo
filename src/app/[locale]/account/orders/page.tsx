"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, ChevronLeft, Loader2, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useTranslations } from "@/hooks/use-translations";

const DATE_LOCALES = { ro: "ro-RO", ru: "ru-RU", en: "en-US" } as const;

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ro";
  const dateLocale = DATE_LOCALES[locale as keyof typeof DATE_LOCALES] || DATE_LOCALES.ro;
  const tr = useTranslations();
  const success = searchParams?.get("success");
  const orderId = searchParams?.get("orderId");
  const shipment = searchParams?.get("shipment");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const statusLabel = (order: any) => {
    if (order.status_slug === "new") return tr.orders.statusNew;
    if (order.status_slug === "closed") return tr.orders.statusClosed;
    if (order.status_slug === "refusal") return tr.orders.statusRefused;
    if (order.status_slug === "processing" || order.status_slug === "in_progress") return tr.orders.statusProcessing;
    return tr.orders.statusUnknown;
  };

  useEffect(() => {
    fetch("/api/account/orders")
      .then((res) => {
        if (res.status === 401) {
          router.push(`/${locale}/login`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data && Array.isArray(data.items)) {
          setOrders(data.items);
        } else {
          setOrders([]);
        }
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [locale, router]);

  return (
    <div className="py-8">
      {success && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-700">
            {tr.orders.placedSuccess}{orderId && ` ${tr.orders.orderNumber.replace("{id}", orderId)}`}
          </p>
        </div>
      )}
      {success && (shipment === "failed" || shipment === "pending" || shipment === "processing" || shipment === "pending_payment") && (
        <div className="mb-6 rounded-lg bg-amber-50 p-4 text-amber-800">
          {tr.orders.shipmentPending}
        </div>
      )}

      <Link href={`/${locale}/account`} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
        <ChevronLeft className="h-4 w-4" />
        {tr.orders.backToAccount}
      </Link>

      <h1 className="text-2xl font-bold mb-6">{tr.orders.title}</h1>

      {loading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-500">{tr.orders.empty}</p>
          <Link href={`/${locale}`} className="mt-4 inline-block rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800">
            {tr.orders.shopNow}
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{tr.orders.orderTitle.replace("{id}", String(order.id))}</p>
                  <p className="text-sm text-slate-500">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString(dateLocale) : ""}
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                  {statusLabel(order)}
                </span>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3 flex justify-between">
                <span className="text-sm text-slate-600">
                  {tr.orders.productCount.replace("{count}", String(order.items?.length || 0))}
                </span>
                <span className="font-bold">{formatPrice(order.total ?? 0)} {tr.rates.currency}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
