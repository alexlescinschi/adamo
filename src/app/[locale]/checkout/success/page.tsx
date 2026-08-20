"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle, FileText, Loader2, MapPin, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useTranslations } from "@/hooks/use-translations";

type Receipt = {
  orderId: number;
  payMode: "CASH" | "BANK_TRANSFER";
  deliveryMethod: "PICKUP" | "COURIER";
  courierProvider?: "FANCOURIER" | "POSTA_RAPIDA";
  delivery?: { city: string; address: string };
  items: { id: number; name: string; qty: number; price: number }[];
  total: number;
  invoiceUrl?: string;
};

function CheckoutSuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "ro";
  const tr = useTranslations();
  const receiptHandle = searchParams.get("receipt") || "";
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [ready, setReady] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useEffect(() => {
    if (!receiptHandle) {
      setReady(true);
      return;
    }
    fetch(`/api/checkout/success?receipt=${encodeURIComponent(receiptHandle)}`)
      .then((response) => response.ok ? response.json() : null)
      .then(setReceipt)
      .catch(() => setReceipt(null))
      .finally(() => setReady(true));
  }, [receiptHandle]);

  async function openInvoice() {
    if (!receiptHandle) return;
    setInvoiceLoading(true);
    try {
      const response = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptHandle }),
      });
      const data = await response.json();
      if (response.ok && data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    } finally {
      setInvoiceLoading(false);
    }
  }

  if (!ready) {
    return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#63ad36]" /></div>;
  }

  if (!receipt) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Package className="mx-auto h-12 w-12 text-[#6b6c6c]" />
        <p className="mt-4 text-[#6b6c6c]">{tr.checkout.receiptUnavailable}</p>
        <Link href={`/${locale}`} className="mt-6 inline-block rounded-[12px] bg-[#63ad36] px-6 py-3 font-semibold text-white">{tr.checkout.continueShopping}</Link>
      </div>
    );
  }

  const deliveryLabel = receipt.deliveryMethod === "PICKUP"
    ? tr.checkout.pickup
    : receipt.courierProvider === "POSTA_RAPIDA" ? tr.cart.courierRapid : tr.checkout.fanCourier;

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="rounded-[16px] border border-[#dcebd5] bg-[#f7fbf4] p-6 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-[#63ad36]" />
        <h1 className="mt-3 text-2xl font-bold text-[#1d1d1f]">{tr.checkout.successTitle}</h1>
        <p className="mt-2 text-[#536070]">{tr.checkout.successBody.replace("{id}", String(receipt.orderId))}</p>
      </div>

      <section className="mt-5 rounded-[14px] border border-[#e4e8e4] bg-white p-5">
        <h2 className="font-bold text-[#1d1d1f]">{tr.checkout.orderDetails}</h2>
        <div className="mt-4 space-y-3">
          {receipt.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <div className="min-w-0"><p className="font-medium text-[#1d1d1f]">{item.name}</p><p className="text-[#6b6c6c]">x{item.qty}</p></div>
              <span className="shrink-0 font-semibold text-[#1d1d1f]">{formatPrice(item.price * item.qty)} {tr.rates.currency}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-[#e4e8e4] pt-4 font-bold text-[#1d1d1f]">
          <span>{tr.cart.total}</span><span>{formatPrice(receipt.total)} {tr.rates.currency}</span>
        </div>
      </section>

      <section className="mt-5 rounded-[14px] border border-[#e4e8e4] bg-white p-5">
        <h2 className="flex items-center gap-2 font-bold text-[#1d1d1f]"><MapPin className="h-5 w-5 text-[#63ad36]" />{tr.checkout.deliveryDetails}</h2>
        <p className="mt-3 text-sm font-medium text-[#1d1d1f]">{deliveryLabel}</p>
        {receipt.delivery && <p className="mt-1 text-sm text-[#6b6c6c]">{[receipt.delivery.city, receipt.delivery.address].filter(Boolean).join(", ")}</p>}
      </section>

      <section className="mt-5 rounded-[14px] border border-[#e4e8e4] bg-white p-5">
        <h2 className="font-bold text-[#1d1d1f]">{tr.checkout.paymentMethod}</h2>
        {receipt.payMode === "BANK_TRANSFER" ? (
          <div className="mt-3">
            <p className="text-sm text-[#6b6c6c]">{tr.checkout.bankPayment}</p>
            {receipt.invoiceUrl ? (
              <a href={receipt.invoiceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-[#63ad36] px-4 py-2.5 text-sm font-semibold text-white"><FileText className="h-4 w-4" />{tr.checkout.downloadInvoice}</a>
            ) : (
              <button type="button" disabled={invoiceLoading} onClick={openInvoice} className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-[#63ad36] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{invoiceLoading && <Loader2 className="h-4 w-4 animate-spin" />}<FileText className="h-4 w-4" />{tr.checkout.downloadInvoice}</button>
            )}
          </div>
        ) : <p className="mt-3 text-sm text-[#6b6c6c]">{tr.checkout.paymentOnDelivery}</p>}
      </section>

      <div className="mt-6 text-center"><Link href={`/${locale}`} className="font-semibold text-[#34781f] hover:underline">{tr.checkout.continueShopping}</Link></div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#63ad36]" /></div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
