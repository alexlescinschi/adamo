"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { Loader2, ShoppingCart, ChevronLeft, Copy, Check, Building2 } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { ADAMO_COMPANY } from "@/lib/company";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const tr = useTranslations();

  const [buyerType, setBuyerType] = useState<"INDIVIDUAL" | "LEGAL">("INDIVIDUAL");
  const [company, setCompany] = useState({ name: "", idno: "" });
  const [contact, setContact] = useState({ full_name: "", phone: "", email: "" });
  const [deliveryMethod, setDeliveryMethod] = useState<"PICKUP" | "COURIER">("PICKUP");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState<number | undefined>();
  const [delivery, setDelivery] = useState({ city: "", address: "", addressNr: "", addressBl: "", addressAp: "", postalCode: "" });
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "BANK_TRANSFER">("ONLINE");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ibanCopied, setIbanCopied] = useState(false);

  const isLegal = buyerType === "LEGAL";

  useEffect(() => {
    if (isLegal) setPaymentMethod("BANK_TRANSFER");
  }, [isLegal]);

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

  function copyIban() {
    navigator.clipboard.writeText(ADAMO_COMPANY.iban).catch(() => {});
    setIbanCopied(true);
    setTimeout(() => setIbanCopied(false), 2000);
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 text-2xl font-bold">{tr.cart.empty}</h1>
        <p className="mt-2 text-slate-500">{tr.checkout.emptyCartSub}</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800">
          {tr.cart.continueShopping}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const companyNote = isLegal
        ? `[${tr.checkout.legalEntity}] ${company.name} | IDNO: ${company.idno}`
        : "";
      const fullComment = [companyNote, comment].filter(Boolean).join(" | ");

      const payload: Record<string, unknown> = {
        items: items.map((i) => ({ product_id: i.product_id, unit_id: i.unit_id, qty: i.qty })),
        delivery_method: deliveryMethod,
        payment_method: paymentMethod,
        contact: {
          full_name: contact.full_name,
          phone: contact.phone,
          email: contact.email || undefined,
        },
        comment: fullComment || undefined,
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
        throw new Error(err.error || tr.checkout.genericError);
      }

      const order = await res.json();
      const orderId = order.id || order.orderId;

      clearCart();

      // Create FanCourier AWB for courier deliveries (non-blocking)
      let awbNumber = "";
      if (deliveryMethod === "COURIER") {
        try {
          const awbRes = await fetch("/api/fancourier/awb", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toName: contact.full_name,
              toCity: delivery.city,
              toZipcode: delivery.postalCode || "2000",
              toStreet: delivery.address,
              toNr: delivery.addressNr || undefined,
              toBl: delivery.addressBl || undefined,
              toAp: delivery.addressAp || undefined,
              toPhone: contact.phone,
              toEmail: contact.email || "",
              orderRef: String(orderId),
              cod: paymentMethod === "BANK_TRANSFER" ? 0 : total,
            }),
          });
          if (awbRes.ok) {
            const awbData = await awbRes.json();
            awbNumber = awbData.awb ?? "";
          }
        } catch {}
      }

      const successBase = `/account/orders?success=true&orderId=${orderId}`;
      const awbSuffix = awbNumber ? `&awb=${awbNumber}` : "";

      if (paymentMethod === "ONLINE") {
        const payRes = await fetch("/api/payments/maib", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            orderId: String(orderId),
            description: `Comanda #${orderId} - Adamo`,
            redirectUrl: `${window.location.origin}${successBase}${awbSuffix}`,
            callbackUrl: `${window.location.origin}/api/webhooks/maib`,
          }),
        });

        if (!payRes.ok) {
          router.push(`${successBase}&paymentError=1${awbSuffix}`);
          return;
        }

        const payData = await payRes.json();
        if (payData.paymentUrl) {
          window.location.href = payData.paymentUrl;
        } else {
          router.push(`${successBase}${awbSuffix}`);
        }
      } else {
        router.push(`${successBase}${awbSuffix}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.checkout.genericError);
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8">
      <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6">
        <ChevronLeft className="h-4 w-4" />
        {tr.checkout.backToCart}
      </Link>

      <h1 className="text-2xl font-bold mb-8">{tr.checkout.title}</h1>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3 w-full min-w-0">
        <div className="lg:col-span-2 space-y-8 min-w-0">

          {/* Buyer type */}
          <section className="rounded-[14px] border border-[#e4e8e4] p-6">
            <h2 className="text-lg font-bold mb-4 text-[#1d1d1f]">{tr.checkout.buyerType}</h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBuyerType("INDIVIDUAL")}
                className={`flex-1 rounded-[10px] border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  buyerType === "INDIVIDUAL"
                    ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                    : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                }`}
              >
                {tr.checkout.individual}
              </button>
              <button
                type="button"
                onClick={() => setBuyerType("LEGAL")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[10px] border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  buyerType === "LEGAL"
                    ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                    : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                }`}
              >
                <Building2 className="h-4 w-4" />
                {tr.checkout.legalEntity}
              </button>
            </div>
          </section>

          {/* Company fields — shown only for legal entity */}
          {isLegal && (
            <section className="rounded-[14px] border border-[#63ad36] bg-[#f7fbf4] p-6">
              <h2 className="text-lg font-bold mb-4 text-[#1d1d1f] flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#34781f]" />
                {tr.checkout.companyDetails}
              </h2>
              <div className="grid gap-4">
                <input
                  type="text"
                  placeholder={tr.checkout.companyName}
                  required
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder={tr.checkout.idno}
                  required
                  value={company.idno}
                  onChange={(e) => setCompany({ ...company, idno: e.target.value })}
                  className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                />
              </div>
            </section>
          )}

          {/* Contact details */}
          <section className="rounded-[14px] border border-[#e4e8e4] p-6">
            <h2 className="text-lg font-bold mb-4 text-[#1d1d1f]">{tr.checkout.contactDetails}</h2>
            <div className="grid gap-4">
              <input
                type="text"
                placeholder={tr.checkout.fullName}
                required
                value={contact.full_name}
                onChange={(e) => setContact({ ...contact, full_name: e.target.value })}
                className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
              />
              <input
                type="tel"
                placeholder={tr.checkout.phone}
                required
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
              />
              <input
                type="email"
                placeholder={tr.checkout.emailOptional}
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
              />
            </div>
          </section>

          {/* Delivery */}
          <section className="rounded-[14px] border border-[#e4e8e4] p-6">
            <h2 className="text-lg font-bold mb-4 text-[#1d1d1f]">{tr.checkout.deliveryMethod}</h2>
            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => setDeliveryMethod("PICKUP")}
                className={`flex-1 rounded-[10px] border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  deliveryMethod === "PICKUP"
                    ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                    : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                }`}
              >
                {tr.checkout.pickup}
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("COURIER")}
                className={`flex-1 rounded-[10px] border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  deliveryMethod === "COURIER"
                    ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                    : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                }`}
              >
                {tr.checkout.courier}
              </button>
            </div>

            {deliveryMethod === "PICKUP" ? (
              <select
                value={warehouseId || ""}
                onChange={(e) => setWarehouseId(Number(e.target.value))}
                className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
              >
                <option value="" disabled>{tr.checkout.selectPickup}</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name || w.address}</option>
                ))}
                {warehouses.length === 0 && (
                  <option value="" disabled>{tr.checkout.noPickups}</option>
                )}
              </select>
            ) : (
              <div className="grid gap-4">
                <input
                  type="text"
                  placeholder={tr.checkout.city}
                  required
                  value={delivery.city}
                  onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                  className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder={tr.checkout.address}
                  required
                  value={delivery.address}
                  onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                  className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder={tr.checkout.addressNr}
                    required
                    value={delivery.addressNr}
                    onChange={(e) => setDelivery({ ...delivery, addressNr: e.target.value })}
                    className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder={tr.checkout.addressBl}
                    value={delivery.addressBl}
                    onChange={(e) => setDelivery({ ...delivery, addressBl: e.target.value })}
                    className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder={tr.checkout.addressAp}
                    value={delivery.addressAp}
                    onChange={(e) => setDelivery({ ...delivery, addressAp: e.target.value })}
                    className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                  />
                </div>
                <input
                  type="text"
                  placeholder={tr.checkout.postalCode}
                  value={delivery.postalCode}
                  onChange={(e) => setDelivery({ ...delivery, postalCode: e.target.value })}
                  className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                />
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="rounded-[14px] border border-[#e4e8e4] p-6">
            <h2 className="text-lg font-bold mb-4 text-[#1d1d1f]">{tr.checkout.paymentMethod}</h2>
            <div className="flex gap-3">
              {!isLegal && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("ONLINE")}
                  className={`flex-1 rounded-[10px] border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    paymentMethod === "ONLINE"
                      ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                      : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                  }`}
                >
                  {tr.checkout.payOnline}
                </button>
              )}
              <button
                type="button"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                disabled={isLegal}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[10px] border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                    : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                }`}
              >
                <Building2 className="h-4 w-4" />
                {tr.checkout.bankTransfer}
              </button>
            </div>

            {/* Bank details card */}
            {paymentMethod === "BANK_TRANSFER" && (
              <div className="mt-5 rounded-[12px] border border-[#e4e8e4] bg-[#f7f9f7] p-5">
                <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#6b6c6c]">
                  {tr.checkout.bankDetailsTitle}
                </p>
                <div className="space-y-2 text-[13px]">
                  {[
                    [tr.checkout.beneficiary, ADAMO_COMPANY.name],
                    ["IDNO", ADAMO_COMPANY.regNumber],
                    [tr.checkout.bank, ADAMO_COMPANY.bank],
                    [tr.checkout.bicSwift, ADAMO_COMPANY.bic],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-[#6b6c6c]">{label}</span>
                      <span className="font-semibold text-[#1d1d1f] text-right">{value}</span>
                    </div>
                  ))}
                  {/* IBAN row with copy */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="text-[#6b6c6c]">IBAN</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#1d1d1f] text-[12px] tracking-wide">
                        {ADAMO_COMPANY.iban}
                      </span>
                      <button
                        type="button"
                        onClick={copyIban}
                        className="flex items-center gap-1 rounded-[6px] border border-[#e4e8e4] bg-white px-2 py-1 text-[11px] font-semibold text-[#34781f] hover:bg-[#edf7e8] transition-colors"
                      >
                        {ibanCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {ibanCopied ? tr.checkout.copied : tr.checkout.copyIban}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="mt-4 rounded-[8px] bg-[#fff9e6] border border-[#f0d060] px-3 py-2 text-[12px] text-[#7a6000]">
                  ⚠ {tr.checkout.bankTransferInstruction}
                </p>
              </div>
            )}
          </section>

          {/* Comment */}
          <section className="rounded-[14px] border border-[#e4e8e4] p-6">
            <h2 className="text-lg font-bold mb-4 text-[#1d1d1f]">{tr.checkout.commentOptional}</h2>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={tr.checkout.commentPlaceholder}
              className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none resize-none"
            />
          </section>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1 min-w-0">
          <div className="rounded-[14px] border border-[#e4e8e4] p-6 sticky top-24">
            <h2 className="text-lg font-bold mb-4 text-[#1d1d1f]">{tr.checkout.yourOrder}</h2>

            {isLegal && company.name && (
              <div className="mb-4 rounded-[10px] bg-[#edf7e8] px-4 py-3 text-[13px]">
                <p className="font-semibold text-[#34781f]">{company.name}</p>
                {company.idno && <p className="text-[#6b6c6c]">IDNO: {company.idno}</p>}
              </div>
            )}

            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.unit_id}`} className="flex gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-[8px] bg-[#f3f6f6]">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[#6b6c6c]">N/A</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-[#1d1d1f]">{item.name}</p>
                    <p className="text-xs text-[#6b6c6c]">x{item.qty}</p>
                  </div>
                  <p className="text-sm font-medium text-[#1d1d1f]">{(item.price * item.qty).toFixed(0)} MDL</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-[10px] bg-[#edf7e8] px-3 py-2 text-sm mb-3">
              <span className="text-[#34781f] font-medium">{tr.cart.deliveryFree}</span>
              <span className="font-bold text-[#34781f]">0 MDL</span>
            </div>
            <div className="border-t border-[#e4e8e4] pt-4 flex justify-between text-lg font-bold text-[#1d1d1f]">
              <span>{tr.cart.total}</span>
              <span>{total.toFixed(0)} MDL</span>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] py-3.5 text-[15px] font-bold text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {tr.checkout.processing}</>
              ) : (
                tr.checkout.placeOrder
              )}
            </button>

            {paymentMethod === "BANK_TRANSFER" && (
              <p className="mt-3 text-xs text-[#6b6c6c] text-center">
                {tr.checkout.bankTransferNote}
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
