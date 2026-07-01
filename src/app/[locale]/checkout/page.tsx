"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { Loader2, ShoppingCart, ChevronLeft, Copy, Check, Building2, FileText } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { ADAMO_COMPANY } from "@/lib/company";
import { resolvePaymentMethod, type CourierProvider } from "@/lib/checkout";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, selectedItems, total, clearCart } = useCart();
  const tr = useTranslations();

  const [buyerType, setBuyerType] = useState<"INDIVIDUAL" | "LEGAL">("INDIVIDUAL");
  const [company, setCompany] = useState({ name: "", idno: "" });
  const [contact, setContact] = useState({ full_name: "", phone: "", email: "" });
  const [deliveryMethod, setDeliveryMethod] = useState<"PICKUP" | "COURIER">("PICKUP");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState<number | undefined>();
  const [delivery, setDelivery] = useState({ city: "", address: "", addressNr: "", addressBl: "", addressAp: "", postalCode: "" });
  const [courierProvider, setCourierProvider] = useState<CourierProvider>("POSTA_RAPIDA");
  const [postaDelivery, setPostaDelivery] = useState({ regionId: 0, cityId: 0, street: "", block: "", zipCode: "" });
  const [postaRegions, setPostaRegions] = useState<{ id: number; name: string }[]>([]);
  const [postaCities, setPostaCities] = useState<{ id: number; name: string }[]>([]);
  const [postaStreets, setPostaStreets] = useState<{ id: number; name: string }[]>([]);
  const [postaBlocks, setPostaBlocks] = useState<{ name: string; zip_code: string }[]>([]);
  const [postaStreetId, setPostaStreetId] = useState(0);
  const [streetSearch, setStreetSearch] = useState("");
  const [streetOpen, setStreetOpen] = useState(false);
  const [payMode, setPayMode] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ibanCopied, setIbanCopied] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{ orderId: string; date: string; orderItems: typeof items; orderTotal: number } | null>(null);

  const isLegal = buyerType === "LEGAL";

  useEffect(() => {
    setPayMode(isLegal ? "BANK_TRANSFER" : "CASH");
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

  useEffect(() => {
    fetch("/api/posta-rapida/nomenclatures?type=regions")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPostaRegions(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!postaDelivery.regionId) return;
    setPostaCities([]);
    setPostaDelivery((d) => ({ ...d, cityId: 0 }));
    fetch(`/api/posta-rapida/nomenclatures?type=cities&region=${postaDelivery.regionId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPostaCities(data); })
      .catch(() => {});
  }, [postaDelivery.regionId]);

  // Fetch streets for selected city — direct from public API
  useEffect(() => {
    if (!postaDelivery.cityId) return;
    setPostaDelivery((d) => ({ ...d, street: "" }));
    setPostaStreetId(0);
    setPostaBlocks([]);
    fetch(`https://main-api.posta.md/nomenclatures/streets?city=${postaDelivery.cityId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data?.results)) setPostaStreets(data.results); })
      .catch(() => {});
  }, [postaDelivery.cityId]);

  // Fetch blocks/zip codes for selected street
  useEffect(() => {
    if (!postaStreetId || !postaDelivery.cityId) return;
    setPostaBlocks([]);
    setPostaDelivery((d) => ({ ...d, zipCode: "" }));
    fetch(`/api/posta-rapida/nomenclatures?type=blocks&city=${postaDelivery.cityId}&street=${postaStreetId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPostaBlocks(data);
          // Auto-fill first available zip code
          const zip = data[0]?.zip_code || "";
          if (zip) setPostaDelivery((d) => ({ ...d, zipCode: zip }));
        }
      })
      .catch(() => {});
  }, [postaStreetId, postaDelivery.cityId]);

  // Pre-fill din localStorage (ultima comandă) + profil CRM dacă e logat.
  // ponytail: localStorage = sursa universală (guest + logat), zero DB pe site.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("adamo-checkout") || "{}");
      if (saved.contact) setContact(saved.contact);
      if (saved.delivery) setDelivery(saved.delivery);
      if (saved.courierProvider) setCourierProvider(saved.courierProvider);
      if (saved.postaDelivery) setPostaDelivery(saved.postaDelivery);
    } catch {}

    fetch("/api/account/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.user) return;
        // /me dă doar email+phone; nu suprascrie ce a pus localStorage pt nume/adresă
        setContact((c) => ({
          full_name: c.full_name || data.user?.username || "",
          phone: c.phone || data.user?.phone || "",
          email: data.user?.email || data.email || c.email,
        }));
      })
      .catch(() => {});
  }, []);

  function buildInvoiceUrl(orderId: string) {
    const now = new Date();
    const date = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()}`;
    return `/api/invoice?orderId=${encodeURIComponent(orderId)}&date=${encodeURIComponent(date)}&buyerName=${encodeURIComponent(company.name)}&buyerIdno=${encodeURIComponent(company.idno)}&total=${total}&items=${encodeURIComponent(JSON.stringify(selectedItems.map((i) => ({ name: i.name, qty: i.qty, price: i.price }))))}`;
  }

  function copyIban() {
    navigator.clipboard.writeText(ADAMO_COMPANY.iban).catch(() => {});
    setIbanCopied(true);
    setTimeout(() => setIbanCopied(false), 2000);
  }

  // Invoice success screen for legal entity orders
  if (invoiceData) {
    const invoiceUrl = `/api/invoice?orderId=${encodeURIComponent(invoiceData.orderId)}&date=${encodeURIComponent(invoiceData.date)}&buyerName=${encodeURIComponent(company.name)}&buyerIdno=${encodeURIComponent(company.idno)}&total=${invoiceData.orderTotal}&items=${encodeURIComponent(JSON.stringify(invoiceData.orderItems.map(i => ({ name: i.name, qty: i.qty, price: i.price }))))}`;
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <div className="rounded-full bg-[#edf7e8] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-[#34781f]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1d1d1f] mb-2">Comanda #{invoiceData.orderId} a fost plasată!</h1>
        <p className="text-[#6b6c6c] mb-8">Descărcați contul spre plată și efectuați transferul bancar la detaliile din document.</p>
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-8 py-4 text-[16px] font-semibold text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all"
        >
          <FileText className="h-5 w-5" />
          Descarcă Cont spre plată (PDF)
        </a>
        <div className="mt-6">
          <Link href="/account/orders" className="text-sm text-[#4e8f28] hover:underline">
            Vezi comenzile mele →
          </Link>
        </div>
      </div>
    );
  }

  if (selectedItems.length === 0) {
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
        items: selectedItems.map((i) => ({ product_id: i.product_id, unit_id: i.unit_id, qty: i.qty })),
        delivery_method: deliveryMethod,
        payment_method: resolvePaymentMethod(payMode, deliveryMethod),
        contact: {
          full_name: contact.full_name,
          phone: contact.phone,
          email: contact.email || undefined,
        },
        comment: fullComment || undefined,
      };

      if (deliveryMethod === "PICKUP" && warehouseId != null && warehouseId > 0) {
        payload.warehouse_id = warehouseId;
      } else if (courierProvider === "POSTA_RAPIDA") {
        const regionName = postaRegions.find((r) => r.id === postaDelivery.regionId)?.name || "";
        const cityName = postaCities.find((c) => c.id === postaDelivery.cityId)?.name || "";
        payload.delivery = {
          city: [cityName, regionName].filter(Boolean).join(", "),
          address: [postaDelivery.street, postaDelivery.block].filter(Boolean).join(", "),
        };
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
      localStorage.setItem(
        "adamo-checkout",
        JSON.stringify({ contact, delivery: { ...delivery }, courierProvider, postaDelivery })
      );

      // Create courier AWB (non-blocking)
      let awbNumber = "";
      if (deliveryMethod === "COURIER") {
        try {
          if (courierProvider === "POSTA_RAPIDA") {
            const prRes = await fetch("/api/posta-rapida/awb", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                toName: contact.full_name,
                toPhone: contact.phone,
                toEmail: contact.email || undefined,
                regionId: postaDelivery.regionId,
                cityId: postaDelivery.cityId,
                street: postaDelivery.street,
                block: postaDelivery.block,
                zipCode: postaDelivery.zipCode || undefined,
                orderRef: String(orderId),
                cod: payMode === "BANK_TRANSFER" ? 0 : total,
              }),
            });
            if (prRes.ok) {
              const prData = await prRes.json();
              awbNumber = prData.shippingNumber ?? prData.awb ?? "";
            } else {
              const errBody = await prRes.text().catch(() => "");
              console.error("[checkout] Poșta AWB error:", prRes.status, errBody);
            }
          } else {
            const awbRes = await fetch("/api/fancourier/awb", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                toName: contact.full_name,
                toCity: delivery.city,
                toZipcode: delivery.postalCode || undefined,
                toStreet: delivery.address,
                toNr: delivery.addressNr || undefined,
                toBl: delivery.addressBl || undefined,
                toAp: delivery.addressAp || undefined,
                toPhone: contact.phone,
                toEmail: contact.email || undefined,
                orderRef: String(orderId),
                cod: payMode === "BANK_TRANSFER" ? 0 : total,
              }),
            });
            if (awbRes.ok) {
              const awbData = await awbRes.json();
              awbNumber = awbData.awb ?? "";
            }
          }
        } catch (err) {
          console.error("[checkout] AWB creation failed:", err);
        }
      }

      const successBase = `/account/orders?success=true&orderId=${orderId}`;
      const awbSuffix = awbNumber ? `&awb=${awbNumber}` : "";

      if (payMode === "BANK_TRANSFER") {
        // Show invoice download screen for legal entity bank transfer
        const now = new Date();
        const date = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()}`;
        setInvoiceData({ orderId: String(orderId), date, orderItems: selectedItems, orderTotal: total });
        setSubmitting(false);
      } else {
        // CASH (plată la livrare) — redirect to success, no payment processing
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
          <section className="rounded-[14px] border border-[#e4e8e4] p-6 overflow-visible">
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
                  <option value="-1">mun. Chișinău, Rîșcani, str. Dumitru Rîșcanu 11</option>
                )}
              </select>
            ) : (
              <div className="space-y-4">
                {/* Courier provider toggle */}
                <div className="flex gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setCourierProvider("POSTA_RAPIDA")}
                    className={`flex-1 rounded-[10px] border-2 px-3 py-2 text-xs font-semibold transition-colors ${
                      courierProvider === "POSTA_RAPIDA"
                        ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                        : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                    }`}
                  >
                    {tr.checkout.postaRapida}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourierProvider("FANCOURIER")}
                    className={`flex-1 rounded-[10px] border-2 px-3 py-2 text-xs font-semibold transition-colors ${
                      courierProvider === "FANCOURIER"
                        ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                        : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                    }`}
                  >
                    {tr.checkout.fanCourier}
                  </button>
                </div>

                {courierProvider === "POSTA_RAPIDA" ? (
                  <div className="grid gap-4">
                    <select
                      value={postaDelivery.regionId || ""}
                      onChange={(e) => setPostaDelivery({ ...postaDelivery, regionId: Number(e.target.value) })}
                      required
                      className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                    >
                      <option value="" disabled>{tr.checkout.selectRegion}</option>
                      {postaRegions.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <select
                      value={postaDelivery.cityId || ""}
                      onChange={(e) => setPostaDelivery({ ...postaDelivery, cityId: Number(e.target.value) })}
                      required
                      disabled={!postaDelivery.regionId}
                      className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                    >
                      <option value="" disabled>{tr.checkout.city}</option>
                      {postaCities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={tr.checkout.address}
                        required
                        value={postaDelivery.street}
                        onChange={(e) => {
                          setPostaDelivery({ ...postaDelivery, street: e.target.value });
                          setStreetSearch(e.target.value.toLowerCase());
                          setPostaStreetId(0);
                          setStreetOpen(true);
                        }}
                        onFocus={() => {
                          if (postaStreets.length > 0) setStreetOpen(true);
                        }}
                        onBlur={() => setTimeout(() => setStreetOpen(false), 300)}
                        className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                      />
                      {streetOpen && postaDelivery.street && (
                        <div className="absolute z-50 w-full mt-1 max-h-[200px] overflow-y-auto rounded-[10px] border border-[#e4e8e4] bg-white shadow-lg">
                          {postaStreets
                            .filter((s) => s.name.toLowerCase().includes(streetSearch))
                            .map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setPostaDelivery({ ...postaDelivery, street: s.name });
                                  setPostaStreetId(s.id);
                                  setStreetOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-[#edf7e8] hover:text-[#34781f]"
                              >
                                {s.name}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder={tr.checkout.blockLabel}
                      required
                      value={postaDelivery.block}
                      onChange={(e) => setPostaDelivery({ ...postaDelivery, block: e.target.value })}
                      className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                    />
                    {postaBlocks.length > 0 ? (
                      <select
                        value={postaDelivery.zipCode}
                        onChange={(e) => setPostaDelivery({ ...postaDelivery, zipCode: e.target.value })}
                        className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                      >
                        {postaBlocks.map((b, i) => (
                          <option key={i} value={b.zip_code}>{b.zip_code}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={tr.checkout.postalCode}
                        value={postaDelivery.zipCode}
                        onChange={(e) => setPostaDelivery({ ...postaDelivery, zipCode: e.target.value })}
                        className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                      />
                    )}
                  </div>
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
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="rounded-[14px] border border-[#e4e8e4] p-6">
            <h2 className="text-lg font-bold mb-4 text-[#1d1d1f]">{tr.checkout.paymentMethod}</h2>
            <div className="flex gap-3">
              {isLegal ? (
                <>
                  {/* Legal: Transfer bancar + Card (coming soon) */}
                  <button
                    type="button"
                    onClick={() => setPayMode("BANK_TRANSFER")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-[10px] border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                      payMode === "BANK_TRANSFER"
                        ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                        : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    {tr.checkout.bankTransfer}
                  </button>
                  <div className="relative flex flex-1">
                    <button
                      type="button"
                      disabled
                      className="flex w-full items-center justify-center gap-2 rounded-[10px] border-2 border-[#e4e8e4] px-4 py-3 text-sm font-semibold text-[#b0b0b0] opacity-60 cursor-not-allowed"
                    >
                      {tr.checkout.payWithCard}
                    </button>
                    <span className="absolute -top-2 right-2 rounded-full bg-[#e4e8e4] px-2 py-0.5 text-[10px] font-bold text-[#6b6c6c] uppercase tracking-wide">
                      {tr.checkout.comingSoon}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {/* Individual: Plată la livrare + Achitare online (coming soon) */}
                  <button
                    type="button"
                    onClick={() => setPayMode("CASH")}
                    className={`flex-1 rounded-[10px] border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                      payMode === "CASH"
                        ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                        : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                    }`}
                  >
                    {tr.checkout.cashOnDelivery}
                  </button>
                  <div className="relative flex flex-1">
                    <button
                      type="button"
                      disabled
                      className="flex w-full items-center justify-center rounded-[10px] border-2 border-[#e4e8e4] px-4 py-3 text-sm font-semibold text-[#b0b0b0] opacity-60 cursor-not-allowed"
                    >
                      {tr.checkout.payOnline}
                    </button>
                    <span className="absolute -top-2 right-2 rounded-full bg-[#e4e8e4] px-2 py-0.5 text-[10px] font-bold text-[#6b6c6c] uppercase tracking-wide">
                      {tr.checkout.comingSoon}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Bank details card */}
            {payMode === "BANK_TRANSFER" && (
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
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="text-[#6b6c6c]">IBAN</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1d1d1f] text-[12px] tracking-wide">
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
                {/* Pre-order invoice download */}
                {(
                  <a
                    href={buildInvoiceUrl("—")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#63ad36] bg-white px-4 py-2.5 text-sm font-semibold text-[#34781f] hover:bg-[#edf7e8] transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    {tr.checkout.downloadInvoice}
                  </a>
                )}
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
              {selectedItems.map((item) => (
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
                  <p className="text-sm font-medium text-[#1d1d1f]">{formatPrice(item.price * item.qty)} MDL</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-[10px] bg-[#edf7e8] px-3 py-2 text-sm mb-3">
              <span className="text-[#34781f] font-medium">{tr.cart.deliveryFree}</span>
              <span className="font-bold text-[#34781f]">0 MDL</span>
            </div>
            <div className="border-t border-[#e4e8e4] pt-4 flex justify-between text-lg font-bold text-[#1d1d1f]">
              <span>{tr.cart.total}</span>
              <span>{formatPrice(total)} MDL</span>
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

            {payMode === "BANK_TRANSFER" && (
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
