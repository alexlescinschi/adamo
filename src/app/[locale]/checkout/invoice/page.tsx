"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

interface InvoiceState {
  orderId: string;
  invoiceUrl?: string;
  invoiceHandle?: string;
}

export default function CheckoutInvoicePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ro";
  const tr = useTranslations();
  const [invoice, setInvoice] = useState<InvoiceState | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("adamo-bank-invoice");
      if (saved) setInvoice(JSON.parse(saved));
    } catch {
      // Invalid session data is treated as expired.
    }
    setReady(true);
  }, []);

  async function retryInvoice() {
    if (!invoice?.invoiceHandle) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceHandle: invoice.invoiceHandle }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error("Invoice unavailable");
      const updated = { ...invoice, invoiceUrl: data.url };
      setInvoice(updated);
      sessionStorage.setItem("adamo-bank-invoice", JSON.stringify(updated));
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setError(tr.invoice.unavailable);
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#63ad36]" /></div>;

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf7e8] p-4">
        <FileText className="h-8 w-8 text-[#34781f]" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-[#1d1d1f]">
        {invoice ? tr.invoice.orderPlaced.replace("{id}", invoice.orderId) : tr.invoice.expiredTitle}
      </h1>
      <p className="mb-8 text-[#6b6c6c]">
        {invoice ? tr.invoice.instructions : tr.invoice.expiredBody}
      </p>
      {invoice?.invoiceUrl && (
        <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-[14px] bg-[#63ad36] px-8 py-4 font-semibold text-white">
          <FileText className="h-5 w-5" /> {tr.invoice.download}
        </a>
      )}
      {invoice && !invoice.invoiceUrl && invoice.invoiceHandle && (
        <button type="button" onClick={retryInvoice} disabled={loading} className="inline-flex items-center gap-2 rounded-[14px] bg-[#63ad36] px-8 py-4 font-semibold text-white disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />} {tr.invoice.retry}
        </button>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6"><Link href={`/${locale}/account/orders`} className="text-sm text-[#4e8f28] hover:underline">{tr.orders.viewMine}</Link></div>
    </div>
  );
}
