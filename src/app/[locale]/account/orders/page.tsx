"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, ChevronLeft, Loader2, Package, Truck } from "lucide-react";
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
    if (order.status_slug === "return") return tr.orders.statusReturned;
    if (order.status_slug === "processing" || order.status_slug === "in_progress") return tr.orders.statusProcessing;
    return order.status || tr.orders.statusUnknown;
  };
  const shipmentStatusLabel = (shipment: any) => {
    switch (shipment.status) {
      case "created": return tr.orders.shipmentCreated;
      case "pickup_courier_assigned":
      case "pickup_courier_accepted": return tr.orders.shipmentPickup;
      case "pickup_confirm_shipment":
      case "price_recalculated":
      case "deposit_received":
      case "deposit_released": return tr.orders.shipmentInTransit;
      case "delivered":
      case "completed": return tr.orders.shipmentDelivered;
      case "returned": return tr.orders.shipmentReturned;
      case "canceled":
      case "abandoned":
      case "destroyed": return tr.orders.shipmentCancelled;
      case "failed":
      case "pickup_courier_rejected":
      case "pickup_failed": return tr.orders.shipmentFailed;
      default: return tr.orders.statusUnknown;
    }
  };

  useEffect(() => {
    let active = true;
    const loadOrders = () => fetch("/api/account/orders")
      .then((res) => {
        if (res.status === 401) {
          router.push(`/${locale}/login`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data && Array.isArray(data.items)) {
          setOrders(data.items);
        } else {
          setOrders([]);
        }
      })
      .catch(() => active && setOrders([]))
      .finally(() => active && setLoading(false));

    loadOrders();
    const interval = setInterval(loadOrders, 5 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
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
              {order.items?.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {order.items.map((item: any) => (
                    <div key={item.id || `${item.product_id}-${item.name}`} className="flex items-start justify-between gap-4 text-sm">
                      <div className="min-w-0">
                        {item.product_id ? (
                          <Link href={`/${locale}/product/${item.product_id}`} className="font-medium text-slate-900 hover:text-[#4e8f28]">
                            {item.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-slate-900">{item.name}</span>
                        )}
                        <span className="ml-2 text-slate-500">x{item.qty}</span>
                      </div>
                      <span className="shrink-0 font-medium text-slate-700">
                        {formatPrice(item.price * item.qty)} {tr.rates.currency}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {order.shipment && (
                <div className="mt-3 flex items-start gap-2 border-t border-slate-100 pt-3 text-sm">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#4e8f28]" />
                  <div>
                    <p className="font-medium text-slate-800">{tr.orders.shipmentCourier}</p>
                    <p className="text-slate-600">{tr.orders.shipmentNumber}: {order.shipment.shippingNumber}</p>
                    {order.shipment.awb && <p className="text-slate-600">{tr.orders.shipmentAwb}: {order.shipment.awb}</p>}
                    <p className="font-medium text-[#34781f]">{shipmentStatusLabel(order.shipment)}</p>
                    {order.shipment.trackingUrl && (
                      <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-block font-medium text-[#4e8f28] hover:underline">
                        {tr.orders.trackShipment} →
                      </a>
                    )}
                    {order.shipment.updatedAt && <p className="text-xs text-slate-500">{tr.orders.shipmentUpdated}: {new Date(order.shipment.updatedAt).toLocaleString(dateLocale)}</p>}
                  </div>
                </div>
              )}
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
