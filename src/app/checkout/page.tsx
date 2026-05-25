"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { Loader2, ShoppingCart, ChevronLeft } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [contact, setContact] = useState({ full_name: "", phone: "", email: "" });
  const [deliveryMethod, setDeliveryMethod] = useState<"PICKUP" | "COURIER">("PICKUP");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState<number | undefined>();
  const [delivery, setDelivery] = useState({ city: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "BANK_TRANSFER">("ONLINE");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/warehouses")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.items || [];
        setWarehouses(list);
        if (list.length > 0 && !warehouseId) setWarehouseId(list[0].id);
      })
      .catch(() => {});
  }, [warehouseId]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 text-2xl font-bold">Coșul tău este gol</h1>
        <p className="mt-2 text-slate-500">Adaugă produse înainte de checkout.</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800">
          Continuă cumpărăturile
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        items: items.map((i) => ({ product_id: i.product_id, unit_id: i.unit_id, qty: i.qty })),
        delivery_method: deliveryMethod,
        payment_method: paymentMethod,
        contact: {
          full_name: contact.full_name,
          phone: contact.phone,
          email: contact.email || undefined,
        },
        comment: comment || undefined,
      };

      if (deliveryMethod === "PICKUP") {
        payload.warehouse_id = warehouseId;
      } else {
        payload.delivery = { city: delivery.city, address: delivery.address };
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Checkout failed");
      }

      const order = await res.json();
      const orderId = order.id || order.orderId;

      clearCart();

      if (paymentMethod === "ONLINE") {
        const payRes = await fetch("/api/payments/maib", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            orderId: String(orderId),
            description: `Comanda #${orderId} - Adamo`,
            redirectUrl: `${window.location.origin}/account/orders?success=true&orderId=${orderId}`,
            callbackUrl: `${window.location.origin}/api/webhooks/maib`,
          }),
        });

        if (!payRes.ok) {
          router.push(`/account/orders?success=true&orderId=${orderId}&paymentError=1`);
          return;
        }

        const payData = await payRes.json();
        if (payData.paymentUrl) {
          window.location.href = payData.paymentUrl;
        } else {
          router.push(`/account/orders?success=true&orderId=${orderId}`);
        }
      } else {
        router.push(`/account/orders?success=true&orderId=${orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "A apărut o eroare");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6">
        <ChevronLeft className="h-4 w-4" />
        Înapoi la coș
      </Link>

      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4">Date de contact</h2>
            <div className="grid gap-4">
              <input
                type="text"
                placeholder="Numele complet"
                required
                value={contact.full_name}
                onChange={(e) => setContact({ ...contact, full_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Telefon"
                required
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email (opțional)"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4">Metoda de livrare</h2>
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setDeliveryMethod("PICKUP")}
                className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  deliveryMethod === "PICKUP"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                Ridicare personală
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("COURIER")}
                className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  deliveryMethod === "COURIER"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                Curier
              </button>
            </div>

            {deliveryMethod === "PICKUP" ? (
              <select
                value={warehouseId || ""}
                onChange={(e) => setWarehouseId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="" disabled>Selectează punctul de ridicare</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name || w.address}
                  </option>
                ))}
                {warehouses.length === 0 && (
                  <option value="" disabled>Nu sunt puncte de ridicare disponibile</option>
                )}
              </select>
            ) : (
              <div className="grid gap-4">
                <input
                  type="text"
                  placeholder="Oraș"
                  required
                  value={delivery.city}
                  onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Adresa"
                  required
                  value={delivery.address}
                  onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4">Metoda de plată</h2>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("ONLINE")}
                className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  paymentMethod === "ONLINE"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                Plată online (maib)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                Transfer bancar
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4">Comentariu (opțional)</h2>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Orice informație suplimentară..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none resize-none"
            />
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-lg border border-slate-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold mb-4">Comanda ta</h2>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.unit_id}`} className="flex gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">N/A</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">x{item.qty}</p>
                  </div>
                  <p className="text-sm font-medium">{(item.price * item.qty).toFixed(2)} MDL</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-4 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{total.toFixed(2)} MDL</span>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Se procesează...</>
              ) : (
                "Plasează comanda"
              )}
            </button>

            {paymentMethod === "BANK_TRANSFER" && (
              <p className="mt-3 text-xs text-slate-500 text-center">
                Vei primi detaliile de plată după plasarea comenzii.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
