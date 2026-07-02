"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { Trash2, Plus, Minus, ShoppingCart, Loader2, Copy, Check, Building2, FileText, ShieldCheck, RefreshCcw, Headphones, CheckCircle, Truck, MapPin, Store, CreditCard, Wallet, Landmark, Percent, ChevronDown } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { CartCheckbox } from "@/components/cart-checkbox";
import { ADAMO_COMPANY } from "@/lib/company";
import { resolvePaymentMethod, type CourierProvider } from "@/lib/checkout";
import { formatPrice } from "@/lib/utils";

type DeliveryChoice = "MD" | "PICKUP" | "CHISINAU";
type PayChoice = "CASH" | "CARD" | "BANK" | "RATE";

// ponytail: secțiune cu titlu + icon, card alb
function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-[#e4e8e4] bg-white p-5">
      <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-[#1d1d1f]">
        <Icon className="h-[18px] w-[18px] text-[#63ad36]" strokeWidth={2} />
        {title}
      </h2>
      {children}
    </section>
  );
}

// ponytail: rând opțiune radio vertical — 1 pe rând full-width
function OptionRow({
  selected,
  disabled,
  comingSoon,
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  icon?: React.ElementType;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[10px] border-2 px-4 py-3.5 text-left transition-colors ${
        selected
          ? "border-[#63ad36] bg-[#edf7e8]"
          : "border-[#e4e8e4] bg-white hover:border-[#63ad36]/40"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <span
        className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-[#63ad36]" : "border-[#cccfcf]"
        }`}
      >
        {selected && <span className="block h-[9px] w-[9px] rounded-full bg-[#63ad36]" />}
      </span>
      {Icon && <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${selected ? "text-[#34781f]" : "text-[#6b6c6c]"}`} strokeWidth={2} />}
      <span className={`flex-1 text-sm font-semibold ${selected ? "text-[#34781f]" : "text-[#1d1d1f]"}`}>{label}</span>
      {comingSoon && (
        <span className="rounded-full bg-[#e4e8e4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6b6c6c]">
          {badge}
        </span>
      )}
      {!comingSoon && badge && (
        <span className="text-xs font-bold text-[#34781f]">{badge}</span>
      )}
    </button>
  );
}

export function CartCheckoutContent({ onDone }: { onDone?: () => void }) {
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

  useEffect(() => {
    if (!postaDelivery.regionId) return;
    setPostaCities([]);
    setPostaDelivery((d) => ({ ...d, cityId: 0 }));
    fetch(`/api/posta-rapida/nomenclatures?type=cities&region=${postaDelivery.regionId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPostaCities(data); })
      .catch(() => {});
  }, [postaDelivery.regionId]);

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

  // ponytail: URL factură pre-order (orderId —) ca pe checkout
  function buildInvoiceUrl(orderId: string) {
    const now = new Date();
    const date = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()}`;
    return `/api/invoice?orderId=${encodeURIComponent(orderId)}&date=${encodeURIComponent(date)}&buyerName=${encodeURIComponent(company.name)}&buyerIdno=${encodeURIComponent(company.idno)}&total=${total}&items=${encodeURIComponent(JSON.stringify(selectedItems.map((i) => ({ name: i.name, qty: i.qty, price: i.price }))))}`;
  }

  const inputCls = "w-full rounded-[10px] border border-[#e4e8e4] bg-white px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none";

  // ponytail: invoice success screen pt transfer bancar
  if (invoiceData) {
    const invoiceUrl = `/api/invoice?orderId=${encodeURIComponent(invoiceData.orderId)}&date=${encodeURIComponent(invoiceData.date)}&buyerName=${encodeURIComponent(company.name)}&buyerIdno=${encodeURIComponent(company.idno)}&total=${invoiceData.orderTotal}&items=${encodeURIComponent(JSON.stringify(invoiceData.orderItems.map(i => ({ name: i.name, qty: i.qty, price: i.price }))))}`;
    return (
      <div className="py-16 text-center">
        <div className="rounded-full bg-[#edf7e8] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-[#34781f]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1d1d1f] mb-2">Comanda #{invoiceData.orderId} a fost plasată!</h1>
        <p className="text-[#6b6c6c] mb-8 px-4">Descărcați contul spre plată și efectuați transferul bancar la detaliile din document.</p>
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-8 py-4 text-[16px] font-semibold text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all"
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
        {onDone ? (
          <button onClick={onDone} className="mt-6 inline-block rounded-[14px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-3 text-white font-medium hover:from-[#63ad36] hover:to-[#4e8f28] transition-all">
            {tr.cart.continueShopping}
          </button>
        ) : (
          <Link href="/" className="mt-6 inline-block rounded-[14px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-3 text-white font-medium hover:from-[#63ad36] hover:to-[#4e8f28] transition-all">
            {tr.cart.continueShopping}
          </Link>
        )}
      </div>
    );
  }

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
      const fullComment = [companyNote, urgentNote].filter(Boolean).join(" | ");

      const payload: Record<string, unknown> = {
        items: selectedItems.map((i) => ({ product_id: i.product_id, unit_id: i.unit_id, qty: i.qty })),
        delivery_method: deliveryMethod,
        payment_method: resolvePaymentMethod(payMode, deliveryMethod),
        contact: { full_name: contact.full_name, phone: contact.phone, email: contact.email || undefined },
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
      localStorage.setItem("adamo-checkout", JSON.stringify({ contact, delivery: { ...delivery }, courierProvider, postaDelivery }));

      // ponytail: creare AWB curier (non-blocking)
      let awbNumber = "";
      if (!isPickup) {
        try {
          if (courierProvider === "POSTA_RAPIDA") {
            const prRes = await fetch("/api/posta-rapida/awb", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                toName: contact.full_name, toPhone: contact.phone, toEmail: contact.email || undefined,
                regionId: postaDelivery.regionId, cityId: postaDelivery.cityId,
                street: postaDelivery.street, block: postaDelivery.block,
                zipCode: postaDelivery.zipCode || undefined, orderRef: String(orderId),
                cod: payMode === "BANK_TRANSFER" ? 0 : total,
              }),
            });
            if (prRes.ok) {
              const prData = await prRes.json();
              awbNumber = prData.shippingNumber ?? prData.awb ?? "";
            }
          } else {
            const awbRes = await fetch("/api/fancourier/awb", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                toName: contact.full_name, toCity: delivery.city, toZipcode: delivery.postalCode || undefined,
                toStreet: delivery.address, toNr: delivery.addressNr || undefined,
                toBl: delivery.addressBl || undefined, toAp: delivery.addressAp || undefined,
                toPhone: contact.phone, toEmail: contact.email || undefined,
                orderRef: String(orderId), cod: payMode === "BANK_TRANSFER" ? 0 : total,
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

      if (payMode === "BANK_TRANSFER") {
        const now = new Date();
        const date = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()}`;
        setInvoiceData({ orderId: String(orderId), date, orderItems: selectedItems, orderTotal: total });
        setSubmitting(false);
        onDone?.();
      } else {
        onDone?.();
        router.push(`/account/orders?success=true&orderId=${orderId}${awbNumber ? `&awb=${awbNumber}` : ""}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.checkout.genericError);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* ===== PRODUSE ===== */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={() => selectAll(!allSelected)}
            label={tr.cart.selectAll}
          />
        </div>
        <div className="space-y-2.5">
          {items.map((item) => {
            const isSelected = item.selected !== false;
            return (
              <div
                key={`${item.product_id}-${item.unit_id}`}
                className={`flex gap-3 rounded-[12px] border border-[#e4e8e4] bg-white p-3 transition-opacity ${isSelected ? "" : "opacity-50"}`}
              >
                <div className="flex items-center">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleSelected(item.product_id, item.unit_id)}
                    label={tr.cart.selectItem}
                  />
                </div>
                <div className="relative h-[68px] w-[68px] flex-shrink-0 overflow-hidden rounded-[8px] bg-[#f3f6f6]">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-[#6b6c6c]">{tr.cart.noImage}</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <Link href={`/product/${item.product_id}`} onClick={onDone} className="text-[13px] font-semibold leading-tight text-[#1d1d1f] hover:text-[#4e8f28] transition-colors line-clamp-2">
                    {item.name}
                  </Link>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center rounded-[8px] border border-[#cccfcf]">
                      <button type="button" className="px-2 py-1 text-[#1d1d1f] hover:bg-[#f3f6f6]" onClick={() => updateQty(item.product_id, item.unit_id, item.qty - 1)}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[24px] text-center text-[13px] font-semibold">{item.qty}</span>
                      <button type="button" className="px-2 py-1 text-[#1d1d1f] hover:bg-[#f3f6f6]" onClick={() => updateQty(item.product_id, item.unit_id, item.qty + 1)}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-[#1d1d1f]">{item.price > 0 ? `${formatPrice(item.price * item.qty)}` : tr.product.priceOnRequest}</span>
                      <button type="button" className="text-[#6b6c6c] hover:text-[#b64400]" onClick={() => removeItem(item.product_id, item.unit_id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== LIVRARE ===== */}
      <Section icon={Truck} title={tr.checkout.deliveryMethod}>
        <div className="space-y-2">
          <OptionRow
            selected={deliveryChoice === "MD"}
            icon={MapPin}
            label={tr.cart.deliveryMD}
            badge="Gratis"
            onClick={() => setDeliveryChoice("MD")}
          />
          <OptionRow
            selected={deliveryChoice === "PICKUP"}
            icon={Store}
            label={tr.cart.deliveryPickup}
            onClick={() => setDeliveryChoice("PICKUP")}
          />
          <OptionRow
            selected={deliveryChoice === "CHISINAU"}
            icon={Truck}
            label={tr.cart.deliveryChisinau}
            badge="Gratis"
            onClick={() => setDeliveryChoice("CHISINAU")}
          />
        </div>

        {/* Expand PICKUP */}
        {deliveryChoice === "PICKUP" && (
          <select
            value={warehouseId || ""}
            onChange={(e) => setWarehouseId(Number(e.target.value))}
            className={`mt-3 ${inputCls}`}
          >
            <option value="" disabled>{tr.checkout.selectPickup}</option>
            {warehouses.map((w: any) => (
              <option key={w.id} value={w.id}>{w.title || w.name || w.address || String(w.id)}</option>
            ))}
            {warehouses.length === 0 && (
              <option value="-1">mun. Chișinău, Rîșcani, str. Dumitru Rîșcanu 11</option>
            )}
          </select>
        )}

        {/* Expand COURIER */}
        {deliveryChoice !== "PICKUP" && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCourierProvider("POSTA_RAPIDA")}
                className={`flex-1 rounded-[8px] border-2 px-2 py-2 text-[12px] font-semibold transition-colors ${
                  courierProvider === "POSTA_RAPIDA" ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]" : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                }`}
              >
                {tr.cart.courierRapid}
              </button>
              <button
                type="button"
                onClick={() => setCourierProvider("FANCOURIER")}
                className={`flex-1 rounded-[8px] border-2 px-2 py-2 text-[12px] font-semibold transition-colors ${
                  courierProvider === "FANCOURIER" ? "border-[#63ad36] bg-[#edf7e8] text-[#34781f]" : "border-[#e4e8e4] text-[#444545] hover:border-[#63ad36]/50"
                }`}
              >
                {tr.checkout.fanCourier}
              </button>
            </div>

            {courierProvider === "POSTA_RAPIDA" ? (
              <div className="grid gap-2.5">
                <select value={postaDelivery.regionId || ""} onChange={(e) => setPostaDelivery({ ...postaDelivery, regionId: Number(e.target.value) })} required className={inputCls}>
                  <option value="" disabled>{tr.checkout.selectRegion}</option>
                  {postaRegions.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                </select>
                <select value={postaDelivery.cityId || ""} onChange={(e) => setPostaDelivery({ ...postaDelivery, cityId: Number(e.target.value) })} required disabled={!postaDelivery.regionId} className={`${inputCls} disabled:opacity-50`}>
                  <option value="" disabled>{tr.checkout.city}</option>
                  {postaCities.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
                <div className="relative">
                  <input
                    type="text" placeholder={tr.checkout.address} required value={postaDelivery.street}
                    onChange={(e) => { setPostaDelivery({ ...postaDelivery, street: e.target.value }); setStreetSearch(e.target.value.toLowerCase()); setPostaStreetId(0); setStreetOpen(true); }}
                    onFocus={() => { if (postaStreets.length > 0) setStreetOpen(true); }}
                    onBlur={() => setTimeout(() => setStreetOpen(false), 300)}
                    className={inputCls}
                  />
                  {streetOpen && (
                    <div className="absolute z-[60] mt-1 max-h-[180px] w-full overflow-y-auto rounded-[10px] border border-[#e4e8e4] bg-white shadow-lg">
                      {postaStreets.filter((s) => s.name.toLowerCase().includes(streetSearch)).map((s) => (
                        <button key={s.id} type="button" onMouseDown={(e) => { e.preventDefault(); setPostaDelivery({ ...postaDelivery, street: s.name }); setPostaStreetId(s.id); setStreetOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-[#edf7e8] hover:text-[#34781f]">{s.name}</button>
                      ))}
                    </div>
                  )}
                </div>
                <input type="text" placeholder={tr.checkout.blockLabel} required value={postaDelivery.block} onChange={(e) => setPostaDelivery({ ...postaDelivery, block: e.target.value })} className={inputCls} />
                {postaBlocks.length > 0 ? (
                  <select value={postaDelivery.zipCode} onChange={(e) => setPostaDelivery({ ...postaDelivery, zipCode: e.target.value })} className={inputCls}>
                    {[...new Set(postaBlocks.map((b) => b.zip_code))].map((zip) => (<option key={zip} value={zip}>{zip}</option>))}
                  </select>
                ) : (
                  <input type="text" placeholder={tr.checkout.postalCode} value={postaDelivery.zipCode} onChange={(e) => setPostaDelivery({ ...postaDelivery, zipCode: e.target.value })} className={inputCls} />
                )}
              </div>
            ) : (
              <div className="grid gap-2.5">
                <input type="text" placeholder={tr.checkout.city} required value={delivery.city} onChange={(e) => setDelivery({ ...delivery, city: e.target.value })} className={inputCls} />
                <input type="text" placeholder={tr.checkout.address} required value={delivery.address} onChange={(e) => setDelivery({ ...delivery, address: e.target.value })} className={inputCls} />
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" placeholder={tr.checkout.addressNr} required value={delivery.addressNr} onChange={(e) => setDelivery({ ...delivery, addressNr: e.target.value })} className={inputCls} />
                  <input type="text" placeholder={tr.checkout.addressBl} value={delivery.addressBl} onChange={(e) => setDelivery({ ...delivery, addressBl: e.target.value })} className={inputCls} />
                  <input type="text" placeholder={tr.checkout.addressAp} value={delivery.addressAp} onChange={(e) => setDelivery({ ...delivery, addressAp: e.target.value })} className={inputCls} />
                </div>
                <input type="text" placeholder={tr.checkout.postalCode} value={delivery.postalCode} onChange={(e) => setDelivery({ ...delivery, postalCode: e.target.value })} className={inputCls} />
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ===== PLATĂ ===== */}
      <Section icon={Wallet} title={tr.checkout.paymentMethod}>
        <div className="space-y-2">
          <OptionRow selected={payChoice === "CASH"} icon={Wallet} label={tr.cart.payCash} onClick={() => setPayChoice("CASH")} />
          <OptionRow selected={false} disabled comingSoon icon={CreditCard} label={tr.cart.payCard} badge={tr.checkout.comingSoon} onClick={() => setPayChoice("CARD")} />
          <OptionRow selected={payChoice === "BANK"} icon={Landmark} label={tr.cart.payBank} onClick={() => setPayChoice("BANK")} />
          <OptionRow selected={false} disabled comingSoon icon={Percent} label={tr.cart.payInstallments} badge={tr.checkout.comingSoon} onClick={() => setPayChoice("RATE")} />
        </div>

        {payChoice === "BANK" && (
          <div className="mt-3 space-y-3">
            <div className="grid gap-2.5 rounded-[10px] border border-[#63ad36] bg-[#f7fbf4] p-3">
              <input type="text" placeholder={tr.checkout.companyName} required value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} className={`${inputCls} bg-white`} />
              <input type="text" placeholder={tr.checkout.idno} required value={company.idno} onChange={(e) => setCompany({ ...company, idno: e.target.value })} className={`${inputCls} bg-white`} />
            </div>
            <div className="rounded-[10px] border border-[#e4e8e4] bg-[#f7f9f7] p-4">
              <div className="space-y-1.5 text-[12px]">
                {[
                  [tr.checkout.beneficiary, ADAMO_COMPANY.name],
                  ["IDNO", ADAMO_COMPANY.regNumber],
                  [tr.checkout.bank, ADAMO_COMPANY.bank],
                  [tr.checkout.bicSwift, ADAMO_COMPANY.bic],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <span className="text-[#6b6c6c]">{label}</span>
                    <span className="text-right font-semibold text-[#1d1d1f]">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[#6b6c6c]">IBAN</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold tracking-wide text-[#1d1d1f]">{ADAMO_COMPANY.iban}</span>
                    <button type="button" onClick={copyIban} className="flex items-center gap-1 rounded-[6px] border border-[#e4e8e4] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#34781f] hover:bg-[#edf7e8]">
                      {ibanCopied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                      {ibanCopied ? tr.checkout.copied : tr.checkout.copyIban}
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-3 rounded-[8px] border border-[#f0d060] bg-[#fff9e6] px-3 py-2 text-[11px] text-[#7a6000]">
                ⚠ {tr.checkout.bankTransferInstruction}
              </p>
              {/* ponytail: descarcă cont spre plată (pre-order) ca pe checkout */}
              <a
                href={buildInvoiceUrl("—")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#63ad36] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#34781f] hover:bg-[#edf7e8] transition-colors"
              >
                <FileText className="h-4 w-4" />
                {tr.checkout.downloadInvoice}
              </a>
            </div>
          </div>
        )}
      </Section>

      {/* ===== DATE CONTACT ===== */}
      <Section icon={Building2} title={tr.checkout.contactDetails}>
        <div className="grid gap-2.5">
          <input type="text" placeholder={tr.checkout.fullName} required value={contact.full_name} onChange={(e) => setContact({ ...contact, full_name: e.target.value })} className={inputCls} />
          <input type="tel" placeholder={tr.checkout.phone} required value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={inputCls} />
          <input type="email" placeholder={tr.checkout.emailOptional} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={inputCls} />
        </div>
      </Section>

      {/* ===== TRUST ===== */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { Icon: ShieldCheck, label: tr.cart.trustWarranty },
          { Icon: CheckCircle, label: tr.cart.trustVerified },
          { Icon: RefreshCcw, label: tr.cart.trustReturn },
          { Icon: Headphones, label: tr.cart.trustConsult },
        ].map(({ Icon, label }) => (
          <div key={label} className="flex items-center gap-2 rounded-[10px] border border-[#e4e8e4] bg-white px-3 py-2.5">
            <Icon className="h-5 w-5 flex-shrink-0 text-[#63ad36]" strokeWidth={1.75} />
            <span className="text-[11px] font-medium leading-tight text-[#1d1d1f]">{label}</span>
          </div>
        ))}
      </div>

      {/* ===== SUMAR + BUTON ===== */}
      <div className="rounded-[14px] border border-[#e4e8e4] bg-white p-4">
        <div className="flex justify-between text-[13px]">
          <span className="text-[#6b6c6c]">{tr.cart.subtotal}</span>
          <span className="font-semibold text-[#1d1d1f]">{formatPrice(total)} MDL</span>
        </div>
        <div className="mt-1.5 flex justify-between text-[13px]">
          <span className="text-[#34781f]">{tr.cart.deliveryFree}</span>
          <span className="font-bold text-[#34781f]">0 MDL</span>
        </div>
        <div className="mt-3 border-t border-[#e4e8e4] pt-3 flex justify-between text-[17px] font-bold text-[#1d1d1f]">
          <span>{tr.cart.total}</span>
          <span>{formatPrice(total)} MDL</span>
        </div>

        {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !hasSelected}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] py-3.5 text-[15px] font-bold text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (<><Loader2 className="h-5 w-5 animate-spin" /> {tr.checkout.processing}</>) : (tr.cart.finalizeOrder)}
        </button>

        {!hasSelected && <p className="mt-2 text-center text-[11px] text-[#6b6c6c]">{tr.cart.selectAtLeastOne}</p>}
      </div>
    </form>
  );
}
