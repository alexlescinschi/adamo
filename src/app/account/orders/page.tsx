"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, ChevronLeft, Loader2, Package } from "lucide-react";

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams?.get("success");
  const orderId = searchParams?.get("orderId");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/orders")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
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
  }, [router]);

  return (
    <div className="py-8">
      {success && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-700">
            Comanda a fost plasată cu succes!{orderId && ` Număr comanda: #${orderId}`}
          </p>
        </div>
      )}

      <Link href="/account" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
        <ChevronLeft className="h-4 w-4" />
        Înapoi la cont
      </Link>

      <h1 className="text-2xl font-bold mb-6">Comenzile mele</h1>

      {loading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-500">Nu ai comenzi încă.</p>
          <Link href="/" className="mt-4 inline-block rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800">
            Cumpără acum
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Comanda #{order.id}</p>
                  <p className="text-sm text-slate-500">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString("ro-RO") : ""}
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                  {order.status || "Nou"}
                </span>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3 flex justify-between">
                <span className="text-sm text-slate-600">{order.items?.length || 0} produse</span>
                <span className="font-bold">{order.total?.toFixed(2) || "0.00"} MDL</span>
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
