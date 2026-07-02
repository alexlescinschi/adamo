"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { Trash2, Plus, Minus, ShoppingCart, Loader2, Copy, Check, Building2, FileText, ShieldCheck, RefreshCcw, Headphones, CheckCircle } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { CartCheckbox } from "@/components/cart-checkbox";
import { ADAMO_COMPANY } from "@/lib/company";
import { resolvePaymentMethod, type CourierProvider } from "@/lib/checkout";
import { formatPrice } from "@/lib/utils";

type DeliveryChoice = "MD" | "PICKUP" | "CHISINAU";
type PayChoice = "CASH" | "CARD" | "BANK" | "RATE";

export default function CartPage() {
  const router = useRouter();
  const { items, selectedItems, total, updateQty, removeItem, toggleSelected, selectAll, allSelected, someSelected, clearCart } = useCart();
  const tr = useTranslations();
  const Checkbox = CartCheckbox;

  const hasSelected = selectedItems.length > 0;

  // --- Contact ---
  const [contact, setContact] = useState({ full_name: "", phone: "", email: "" });

  // --- Delivery ---
  const [deliveryChoice, setDeliveryChoice] = useState<DeliveryChoice>("MD");
  const [courierProvider, setCourierProvider] = useState<CourierProvider>("POSTA_RAPIDA");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState<number | undefined>();
  const [delivery, setDelivery] = useState({ city: "", address: "", addressNr: "", addressBl: "", addressAp: "", postalCode: "" });
  const [postaDelivery, setPostaDelivery] = useState({ regionId: 0, cityId: 0, street: "", block: "", zipCode: "" });
  const [postaRegions, setPostaRegions] = useState<{ id: number; name: string }[]>([]);
  const [postaCities, setPostaCities] = useState<{ id: number; name: string }[]>([]);
  const [postaStreets, setPostaStreets] = useState<{ id: number; name: string }[]>([]);
  const [postaBlocks, setPostaBlocks] = useState<{ name: string; zip_code: string }[]>([]);
  const [postaStreetId, setPostaStreetId] = useState(0);
  const [streetSearch, setStreetSearch] = useState("");
  const [streetOpen, setStreetOpen] = useState(false);

  // --- Payment ---
  const [payChoice, setPayChoice] = useState<PayChoice>("CASH");
  const [company, setCompany] = useState({ name: "", idno: "" });
  const [ibanCopied, setIbanCopied] = useState(false);

  // --- Comment ---
  const [comment, setComment] = useState("");

  // --- Submit state ---
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [invoiceData, setInvoiceData] = useState<{ orderId: string; date: string; orderItems: typeof items; orderTotal: number } | null>(null);

  // ponytail: fetch pickup warehouses
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

  // ponytail: fetch posta regions
  useEffect(() => {
    fetch("/api/posta-rapida/nomenclatures?type=regions")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPostaRegions(data); })
      .catch(() => {});
  }, []);

  // ponytail: fetch cities when region changes
  useEffect(() => {
    if (!postaDelivery.regionId) return;
    setPostaCities([]);
    setPostaDelivery((d) => ({ ...d, cityId: 0 }));
    fetch(`/api/posta-rapida/nomenclatures?type=cities&region=${postaDelivery.regionId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPostaCities(data); })
      .catch(() => {});
  }, [postaDelivery.regionId]);

  // ponytail: fetch streets when city changes — direct from public API
  useEffect(() => {
    if (!postaDelivery.cityId) return;
    setPostaDelivery((d) => ({ ...d, street: "" }));
    setPostaStreetId(0);
    setPostaBlocks([]);
    fetch(`https://main-api.posta.md/nomenclatures/streets?city=${postaDelivery.cityId}&per_page=1000`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data?.results)) setPostaStreets(data.results); })
      .catch(() => {});
  }, [postaDelivery.cityId]);

  // ponytail: fetch blocks/zip when street changes
  useEffect(() => {
    if (!postaStreetId || !postaDelivery.cityId) return;
    setPostaBlocks([]);
    setPostaDelivery((d) => ({ ...d, zipCode: "" }));
    fetch(`/api/posta-rapida/nomenclatures?type=blocks&city=${postaDelivery.cityId}&street=${postaStreetId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPostaBlocks(data);
          const zip = data[0]?.zip_code || "";
          if (zip) setPostaDelivery((d) => ({ ...d, zipCode: zip }));
        }
      })
      .catch(() => {});
  }, [postaStreetId, postaDelivery.cityId]);

  // ponytail: pre-fill din localStorage + profil CRM
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
        setContact((c) => ({
          full_name: c.full_name || data.user?.username || "",
          phone: data.user?.phone || c.phone || "",
          email: data.user?.email || data.email || c.email,
        }));
      })
      .catch(() => {});
  }, []);

  function copyIban() {
    navigator.clipboard.writeText(ADAMO_COMPANY.iban).catch(() => {});
    setIbanCopied(true);
    setTimeout(() => setIbanCopied(false), 2000);
  }

  // ponytail: invoice success screen pentru transfer bancar
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

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-[#cccfcf]" />
        <h1 className="mt-4 text-2xl font-bold text-[#1d1d1f]">{tr.cart.empty}</h1>
        <p className="mt-2 text-[#6b6c6c]">{tr.cart.emptySub}</p>
        <Link href="/" className="mt-6 inline-block rounded-[14px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-3 text-white font-medium hover:from-[#63ad36] hover:to-[#4e8f28] transition-all">
          {tr.cart.continueShopping}
        </Link>
      </div>
    );
  }

  // ponytail: PICKUP → delivery_method PICKUP. Altfel COURIER.
  const isPickup = deliveryChoice === "PICKUP";
  const deliveryMethod: "PICKUP" | "COURIER" = isPickup ? "PICKUP" : "COURIER";
  const payMode: "CASH" | "BANK_TRANSFER" = payChoice === "BANK" ? "BANK_TRANSFER" : "CASH";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError(tr.cart.selectAtLeastOne);
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const companyNote = payChoice === "BANK" && company.name
        ? `[${tr.checkout.legalEntity}] ${company.name} | IDNO: ${company.idno}`
        : "";
      const urgentNote = deliveryChoice === "CHISINAU" ? "[Livrare urgentă Chișinău]" : "";
      const fullComment = [companyNote, urgentNote, comment].filter(Boolean).join(" | ");

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

      if (isPickup && warehouseId != null && warehouseId > 0) {
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

      // ponytail: creare AWB curier (non-blocking)
      let awbNumber = "";
      if (!isPickup) {
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
              console.error("[cart] Curier Rapid AWB error:", prRes.status, errBody);
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
          console.error("[cart] AWB creation failed:", err);
        }
      }

      const successBase = `/account/orders?success=true&orderId=${orderId}`;
      const awbSuffix = awbNumber ? `&awb=${awbNumber}` : "";

      if (payMode === "BANK_TRANSFER") {
        const now = new Date();
        const date = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()}`;
        setInvoiceData({ orderId: String(orderId), date, orderItems: selectedItems, orderTotal: total });
        setSubmitting(false);
      } else {
        router.push(`${successBase}${awbSuffix}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.checkout.genericError);
      setSubmitting(false);
    }
  };

  return (
    <div className="py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={() => selectAll(!allSelected)}
          label={tr.cart.selectAll}
        />
        <h1 className="text-2xl font-bold text-[#1d1d1f]">{tr.cart.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3 w-full min-w-0">
        <div className="lg:col-span-2 space-y-6 min-w-0">

          {/* ===== SECȚIUNEA 1: PRODUSE (neschimbat) ===== */}
          <div className="space-y-3">
            {items.map((item) => {
              const isSelected = item.selected !== false;
              return (
                <div
                  key={`${item.product_id}-${item.unit_id}`}
                  className={`flex gap-4 rounded-lg border border-slate-200 p-4 transition-opacity ${isSelected ? "" : "opacity-50"}`}
                >
                  <div className="flex items-center">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleSelected(item.product_id, item.unit_id)}
                      label={tr.cart.selectItem}
                    />
                  </div>
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">{tr.cart.noImage}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link href={`/product/${item.product_id}`} className="font-medium hover:underline text-[#1d1d1f]">
                      {item.name}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {item.price > 0 ? `${formatPrice(item.price)} MDL` : tr.product.priceOnRequest}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center rounded-md border border-slate-300">
                      <button
                        type="button"
                        className="px-2 py-1 hover:bg-slate-100"
                        onClick={() => updateQty(item.product_id, item.unit_id, item.qty - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium">{item.qty}</span>
                      <button
                        type="button"
                        className="px-2 py-1 hover:bg-slate-100"
                        onClick={() => updateQty(item.product_id, item.unit_id, item.qty + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-red-600"
                      onClick={() => removeItem(item.product_id, item.unit_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ===== SECȚIUNEA 2: LIVRARE ===== */}
          <section className="rounded-[14px] border border-[#e4e8e4] p-5 md:p-6 overflow-visible">
            <h2 className="text-lg font-bold mb-4 text-[#1d1d1f]">{tr.checkout.deliveryMethod}</h2>
            <div className="grid gap-3 sm:grid-cols-3 mb-4">
              {([
                { key: "MD", label: tr.cart.deliveryMD },
                { key: "PICKUP", label: tr.cart.deliveryPickup },
                { key: "CHISINAU", label: tr.cart.deliveryChisinau },
              ] as { key: DeliveryChoice; label: string }[]).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDeliveryChoice(opt.key)}
                  className={`rounded-[10px] border-2 px-3 py-3 text-sm font-semibold transition-colors text-center ${
                    deliveryChoice === opt.key
                      ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                      : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Expand: PICKUP → depozit */}
            {deliveryChoice === "PICKUP" ? (
              <div className="transition-all">
                <select
                  value={warehouseId || ""}
                  onChange={(e) => setWarehouseId(Number(e.target.value))}
                  className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                >
                  <option value="" disabled>{tr.checkout.selectPickup}</option>
                  {warehouses.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.title || w.name || w.address || String(w.id)}</option>
                  ))}
                  {warehouses.length === 0 && (
                    <option value="-1">mun. Chișinău, Rîșcani, str. Dumitru Rîșcanu 11</option>
                  )}
                </select>
              </div>
            ) : (
              <div className="space-y-4 transition-all">
                {/* Toggle curier: Curier Rapid / FanCourier — ambele funcționale */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCourierProvider("POSTA_RAPIDA")}
                    className={`flex-1 rounded-[10px] border-2 px-3 py-2 text-xs font-semibold transition-colors ${
                      courierProvider === "POSTA_RAPIDA"
                        ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                        : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                    }`}
                  >
                    {tr.cart.courierRapid}
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
                      className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none disabled:opacity-50"
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
                        onFocus={() => { if (postaStreets.length > 0) setStreetOpen(true); }}
                        onBlur={() => setTimeout(() => setStreetOpen(false), 300)}
                        className="w-full rounded-[10px] border border-[#e4e8e4] px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                      />
                      {streetOpen && (
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
                        {[...new Set(postaBlocks.map((b) => b.zip_code))].map((zip) => (
                          <option key={zip} value={zip}>{zip}</option>
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

          {/* ===== SECȚIUNEA 3: PLATĂ ===== */}
          <section className="rounded-[14px] border border-[#e4e8e4] p-5 md:p-6">
            <h2 className="text-lg font-bold mb-4 text-[#1d1d1f]">{tr.checkout.paymentMethod}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Achitare la livrare */}
              <button
                type="button"
                onClick={() => setPayChoice("CASH")}
                className={`rounded-[10px] border-2 px-4 py-3 text-sm font-semibold transition-colors text-left ${
                  payChoice === "CASH"
                    ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                    : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                }`}
              >
                {tr.cart.payCash}
              </button>

              {/* Achitare online cu cardul — coming soon */}
              <div className="relative">
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center rounded-[10px] border-2 border-[#e4e8e4] px-4 py-3 text-sm font-semibold text-[#b0b0b0] opacity-70 cursor-not-allowed"
                >
                  {tr.cart.payCard}
                </button>
                <span className="absolute -top-2 right-2 rounded-full bg-[#e4e8e4] px-2 py-0.5 text-[10px] font-bold text-[#6b6c6c] uppercase tracking-wide">
                  {tr.checkout.comingSoon}
                </span>
              </div>

              {/* Transfer bancar / factură */}
              <button
                type="button"
                onClick={() => setPayChoice("BANK")}
                className={`flex items-center gap-2 rounded-[10px] border-2 px-4 py-3 text-sm font-semibold transition-colors text-left ${
                  payChoice === "BANK"
                    ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]"
                    : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                }`}
              >
                <Building2 className="h-4 w-4 flex-shrink-0" />
                {tr.cart.payBank}
              </button>

              {/* Rate 0% — coming soon */}
              <div className="relative">
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center rounded-[10px] border-2 border-[#e4e8e4] px-4 py-3 text-sm font-semibold text-[#b0b0b0] opacity-70 cursor-not-allowed"
                >
                  {tr.cart.payInstallments}
                </button>
                <span className="absolute -top-2 right-2 rounded-full bg-[#e4e8e4] px-2 py-0.5 text-[10px] font-bold text-[#6b6c6c] uppercase tracking-wide">
                  {tr.checkout.comingSoon}
                </span>
              </div>
            </div>

            {/* Expand: BANK → câmpuri companie + date bancare */}
            {payChoice === "BANK" && (
              <div className="mt-5 space-y-5 transition-all">
                <div className="grid gap-3 rounded-[12px] border border-[#63ad36] bg-[#f7fbf4] p-4">
                  <input
                    type="text"
                    placeholder={tr.checkout.companyName}
                    required
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    className="w-full rounded-[10px] border border-[#e4e8e4] bg-white px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder={tr.checkout.idno}
                    required
                    value={company.idno}
                    onChange={(e) => setCompany({ ...company, idno: e.target.value })}
                    className="w-full rounded-[10px] border border-[#e4e8e4] bg-white px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
                  />
                </div>

                <div className="rounded-[12px] border border-[#e4e8e4] bg-[#f7f9f7] p-5">
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
                </div>
              </div>
            )}
          </section>

          {/* ===== SECȚIUNEA 4: DATE CONTACT ===== */}
          <section className="rounded-[14px] border border-[#e4e8e4] p-5 md:p-6">
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

          {/* ===== SECȚIUNEA 5: TRUST ===== */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { Icon: ShieldCheck, label: tr.cart.trustWarranty },
              { Icon: CheckCircle, label: tr.cart.trustVerified },
              { Icon: RefreshCcw, label: tr.cart.trustReturn },
              { Icon: Headphones, label: tr.cart.trustConsult },
            ].map(({ Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-[12px] border border-[#e4e8e4] bg-white px-3 py-4 text-center"
              >
                <Icon className="h-6 w-6 text-[#63ad36]" strokeWidth={1.75} />
                <span className="text-[12px] font-medium leading-tight text-[#1d1d1f]">{label}</span>
              </div>
            ))}
          </section>
        </div>

        {/* ===== SUMAR + BUTON ===== */}
        <div className="lg:col-span-1 min-w-0">
          <div className="rounded-[14px] border border-[#e4e8e4] p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold mb-4 text-[#1d1d1f]">{tr.cart.summary}</h2>

            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#6b6c6c]">{tr.cart.subtotal}</span>
              <span className="font-semibold text-[#1d1d1f]">{formatPrice(total)} MDL</span>
            </div>
            <div className="flex items-center justify-between rounded-[10px] bg-[#edf7e8] px-3 py-2 text-sm mb-4">
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
              disabled={submitting || !hasSelected}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] py-4 text-[16px] font-bold text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> {tr.checkout.processing}</>
              ) : (
                tr.cart.finalizeOrder
              )}
            </button>

            {!hasSelected && (
              <p className="mt-3 text-center text-xs text-[#6b6c6c]">{tr.cart.selectAtLeastOne}</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
