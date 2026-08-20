"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { Trash2, Plus, Minus, ShoppingCart, Loader2, Copy, Check, Building2, ShieldCheck, RefreshCcw, Headphones, CheckCircle, Truck, MapPin, Store, CreditCard, Wallet, Landmark, Percent } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { CartCheckbox } from "@/components/cart-checkbox";
import { ADAMO_COMPANY } from "@/lib/company";
import type { CourierProvider } from "@/lib/checkout";
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
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "ro";
  const { items, selectedItems, total, updateQty, removeItem, toggleSelected, selectAll, allSelected, someSelected, clearCart, preferredPayment } = useCart();
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
  const [payChoice, setPayChoice] = useState<PayChoice>(
    preferredPayment === "RATE" ? "RATE" : "CASH"
  );
  const [company, setCompany] = useState({ name: "", idno: "" });
  const [ibanCopied, setIbanCopied] = useState(false);

  // --- Submit state ---
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const idempotencyKey = useRef("");

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
  const [postaListsLoading, setPostaListsLoading] = useState({ regions: false, cities: false, streets: false, blocks: false });
  useEffect(() => {
    if (courierProvider !== "POSTA_RAPIDA" || deliveryChoice === "PICKUP" || postaRegions.length > 0) return;
    setPostaListsLoading(l => ({ ...l, regions: true }));
    fetch("/api/posta-rapida/nomenclatures?type=regions")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPostaRegions(data); })
      .catch(() => {})
      .finally(() => setPostaListsLoading(l => ({ ...l, regions: false })));
  }, [courierProvider, deliveryChoice, postaRegions.length]);

  useEffect(() => {
    if (!postaDelivery.regionId) return;
    setPostaCities([]);
    setPostaDelivery((d) => ({ ...d, cityId: 0 }));
    setPostaListsLoading(l => ({ ...l, cities: true }));
    fetch(`/api/posta-rapida/nomenclatures?type=cities&region=${postaDelivery.regionId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPostaCities(data); })
      .catch(() => {})
      .finally(() => setPostaListsLoading(l => ({ ...l, cities: false })));
  }, [postaDelivery.regionId]);

  useEffect(() => {
    if (!postaDelivery.cityId) return;
    setPostaDelivery((d) => ({ ...d, street: "" }));
    setPostaStreetId(0);
    setPostaBlocks([]);
    setPostaListsLoading(l => ({ ...l, streets: true }));
    fetch(`/api/posta-rapida/nomenclatures?type=streets&city=${postaDelivery.cityId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPostaStreets(data); })
      .catch(() => {})
      .finally(() => setPostaListsLoading(l => ({ ...l, streets: false })));
  }, [postaDelivery.cityId]);

  useEffect(() => {
    if (!postaStreetId || !postaDelivery.cityId) return;
    setPostaBlocks([]);
    setPostaDelivery((d) => ({ ...d, zipCode: "" }));
    setPostaListsLoading(l => ({ ...l, blocks: true }));
    fetch(`/api/posta-rapida/nomenclatures?type=blocks&city=${postaDelivery.cityId}&street=${postaStreetId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPostaBlocks(data);
          const zip = data[0]?.zip_code || "";
          if (zip) setPostaDelivery((d) => ({ ...d, zipCode: zip }));
        }
      })
      .catch(() => {})
      .finally(() => setPostaListsLoading(l => ({ ...l, blocks: false })));
  }, [postaStreetId, postaDelivery.cityId]);

  // ponytail: pre-fill contact din CRM (sursa de adevăr). Delivery prefs din localStorage.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("adamo-checkout") || "{}");
      if (saved.delivery) setDelivery(saved.delivery);
      if (saved.courierProvider) {
        setCourierProvider(saved.courierProvider);
      }
      if (saved.postaDelivery) setPostaDelivery(saved.postaDelivery);
    } catch {}

    fetch("/api/account/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.user) return;
        setContact({
          full_name: data.user?.username || "",
          phone: data.user?.phone || "",
          email: data.user?.email || data.email || "",
        });
      })
      .catch(() => {});
  }, []);

  // ponytail: verific dacă IutePay e activ (chei prezente). Activează opțiune RATE.
  const [iuteEnabled, setIuteEnabled] = useState(false);
  useEffect(() => {
    fetch("/api/payments/iute")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setIuteEnabled(Boolean(data?.enabled)))
      .catch(() => setIuteEnabled(false));
  }, []);

  function copyIban() {
    navigator.clipboard.writeText(ADAMO_COMPANY.iban).catch(() => {});
    setIbanCopied(true);
    setTimeout(() => setIbanCopied(false), 2000);
  }

  function localizedCheckoutError(code: unknown) {
    if (typeof code !== "string" || !Object.prototype.hasOwnProperty.call(tr.errors, code)) {
      return tr.checkout.genericError;
    }
    return (tr.errors as Record<string, string>)[code];
  }

  const inputCls = "w-full rounded-[10px] border border-[#e4e8e4] bg-white px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none";

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
          <Link href={`/${locale}`} className="mt-6 inline-block rounded-[14px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-3 text-white font-medium hover:from-[#63ad36] hover:to-[#4e8f28] transition-all">
            {tr.cart.continueShopping}
          </Link>
        )}
      </div>
    );
  }

  const isPickup = deliveryChoice === "PICKUP";
  const deliveryMethod: "PICKUP" | "COURIER" = isPickup ? "PICKUP" : "COURIER";
  // ponytail: RATE = IutePay BNPL redirect. Treate ca pre-plată (cod 0 la curier).
  const payMode: "CASH" | "BANK_TRANSFER" | "RATE" =
    payChoice === "BANK" ? "BANK_TRANSFER" : payChoice === "RATE" ? "RATE" : "CASH";
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
        pay_mode: payMode,
        contact: { full_name: contact.full_name, phone: contact.phone, email: contact.email || undefined },
        comment: fullComment || undefined,
      };

      // ponytail: adresă reală pt. Iute Credit (KYC) — nu doar payload-ul de livrare CRM.
      let iuteAddress = { line1: "", city: "", zipcode: "" };

      if (isPickup && warehouseId != null && warehouseId > 0) {
        payload.warehouse_id = warehouseId;
        const wh = warehouses.find((w: any) => w.id === warehouseId) as any;
        iuteAddress = {
          line1: wh?.address || wh?.title || wh?.name || "",
          city: wh?.city || wh?.location || "",
          zipcode: wh?.zipCode || wh?.zip_code || "",
        };
      } else if (courierProvider === "POSTA_RAPIDA") {
        const regionName = postaRegions.find((r) => r.id === postaDelivery.regionId)?.name || "";
        const cityName = postaCities.find((c) => c.id === postaDelivery.cityId)?.name || "";
        payload.delivery = {
          city: [cityName, regionName].filter(Boolean).join(", "),
          address: [postaDelivery.street, postaDelivery.block].filter(Boolean).join(", "),
        };
        payload.courier = {
          provider: "POSTA_RAPIDA",
          regionId: postaDelivery.regionId,
          cityId: postaDelivery.cityId,
          street: postaDelivery.street,
          block: postaDelivery.block,
          zipCode: postaDelivery.zipCode || undefined,
        };
        iuteAddress = {
          line1: [postaDelivery.street, postaDelivery.block].filter(Boolean).join(", "),
          city: [cityName, regionName].filter(Boolean).join(", "),
          zipcode: postaDelivery.zipCode || "",
        };
      } else {
        payload.delivery = { city: delivery.city, address: delivery.address };
        payload.courier = {
          provider: "FANCOURIER",
          city: delivery.city,
          street: delivery.address,
          postalCode: delivery.postalCode || undefined,
          number: delivery.addressNr || undefined,
          building: delivery.addressBl || undefined,
          apartment: delivery.addressAp || undefined,
        };
        iuteAddress = {
          line1: [delivery.address, delivery.addressNr, delivery.addressBl, delivery.addressAp].filter(Boolean).join(", "),
          city: delivery.city,
          zipcode: delivery.postalCode || "",
        };
      }

      if (!idempotencyKey.current) {
        idempotencyKey.current = localStorage.getItem("adamo-checkout-operation") || crypto.randomUUID();
        localStorage.setItem("adamo-checkout-operation", idempotencyKey.current);
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.code === "operationConflict") {
          idempotencyKey.current = "";
          localStorage.removeItem("adamo-checkout-operation");
        }
        setError(localizedCheckoutError(err.code));
        setSubmitting(false);
        return;
      }

      const order = await res.json();
      const orderId = order.id || order.orderId;
      const guestSuccessUrl = !order.accountLinked && order.receiptHandle
        ? `/${locale}/checkout/success?receipt=${encodeURIComponent(order.receiptHandle)}`
        : "";

      const saveCheckout = () => {
        localStorage.setItem("adamo-checkout", JSON.stringify({ contact, delivery: { ...delivery }, courierProvider, postaDelivery }));
        localStorage.removeItem("adamo-checkout-operation");
        clearCart();
      };

      if (payMode === "BANK_TRANSFER") {
        saveCheckout();
        if (guestSuccessUrl) {
          onDone?.();
          router.push(guestSuccessUrl);
          return;
        }
        sessionStorage.setItem("adamo-bank-invoice", JSON.stringify({
          orderId: String(orderId),
          invoiceUrl: order.invoice?.url,
          invoiceHandle: order.invoiceHandle,
        }));
        onDone?.();
        router.push(`/${locale}/checkout/invoice`);
      } else if (payMode === "RATE") {
        // ponytail: IutePay iframe/modal mode via iute.checkout().
        // CRM /iute/prepare returns signed anti-fraud payload:
        //   { signature, signature_timestamp, merchant_order_id, items, total, currency }
        // iutepay.js SDK opens modal inline — customer completes app on site.
        const p = order.iutePayload;
        if (!p?.signature) {
          setError(tr.checkout.iuteMissingPayload);
          setSubmitting(false);
          return;
        }
        if (typeof window === "undefined" || !window.iute || typeof window.iute.checkout !== "function") {
          setError(tr.checkout.iuteSdkUnavailable);
          setSubmitting(false);
          return;
        }
        setSubmitting(false);

        const nameParts = (contact.full_name || "").trim().split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] || "Client";
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

        try {
          window.iute.checkout(
            {
              orderId: String(p.merchant_order_id),
              signature: String(p.signature),
              signatureTimestamp: String(p.signature_timestamp),
              items: (p.items || []).map((item: any) => ({
                ...item,
                  itemUrl: item.itemUrl || `${window.location.origin}/${locale}/product/${item.id}`,
              })),
              currency: p.currency || "mdl",
              shippingAmount: Number(p.shipping_amount ?? 0),
              taxAmount: Number(p.tax_amount ?? 0),
              subtotal: Number(p.subtotal ?? p.total ?? 0),
              total: Number(p.total ?? 0),
              shipping: {
                name: { first: firstName, last: lastName },
                phoneNumber: contact.phone || "",
                email: contact.email || "",
                address: {
                  line1: iuteAddress.line1,
                  line2: "",
                  city: iuteAddress.city,
                  state: "",
                  zipcode: iuteAddress.zipcode,
                  country: "mda",
                },
              },
              billing: {
                name: { first: firstName, last: lastName },
                phoneNumber: contact.phone || "",
                email: contact.email || "",
                address: {
                  line1: iuteAddress.line1,
                  line2: "",
                  city: iuteAddress.city,
                  state: "",
                  zipcode: iuteAddress.zipcode,
                  country: "mda",
                },
              },
            },
            {
              onSuccess: () => {
                saveCheckout();
                onDone?.();
                router.push(`/${locale}/account/orders?success=true&orderId=${orderId}${order.shipment ? "&shipment=pending_payment" : ""}`);
              },
              onFailure: () => {
                setError(tr.checkout.iuteApplicationFailed);
              },
            }
          );
        } catch (e) {
          console.error("[iute] checkout call failed:", e);
          setError(tr.checkout.iuteInitializationFailed);
        }
      } else {
        saveCheckout();
        onDone?.();
        if (guestSuccessUrl) {
          router.push(guestSuccessUrl);
          return;
        }
        const shipmentNumber = order.shipment?.number || order.shipment?.awb;
        const shipmentStatus = order.shipment?.status;
        router.push(`/${locale}/account/orders?success=true&orderId=${orderId}${shipmentNumber ? `&awb=${encodeURIComponent(shipmentNumber)}` : ""}${shipmentStatus ? `&shipment=${encodeURIComponent(shipmentStatus)}` : ""}`);
      }
    } catch {
      setError(tr.checkout.genericError);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* ===== PRODUSE ===== */}
      <div>
        <div className="rounded-[12px] border border-[#e4e8e4] bg-white divide-y divide-[#e4e8e4]">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={() => selectAll(!allSelected)}
              label={tr.cart.selectAll}
            />
            <span
              className="text-[13px] font-semibold text-[#1d1d1f] cursor-pointer select-none"
              onClick={() => selectAll(!allSelected)}
            >
              {tr.cart.selectAll}
            </span>
          </div>
          {items.map((item) => {
            const isSelected = item.selected !== false;
            return (
              <div
                key={`${item.product_id}-${item.unit_id}`}
                className={`flex gap-3 p-3 transition-opacity ${isSelected ? "" : "opacity-50"}`}
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
                  <Link href={`/${locale}/product/${item.product_id}`} onClick={onDone} className="text-[13px] font-semibold leading-tight text-[#1d1d1f] hover:text-[#4e8f28] transition-colors line-clamp-2">
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
                      <div className="text-right">
                        {item.old_price && item.old_price > item.price && (
                          <span data-testid="old-price" className="block text-[11px] text-[#6b6c6c] line-through">{formatPrice(item.old_price * item.qty)}</span>
                        )}
                        <span data-testid="current-price" className="block text-[13px] font-bold text-[#1d1d1f]">{item.price > 0 ? `${formatPrice(item.price * item.qty)}` : tr.product.priceOnRequest}</span>
                      </div>
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
            badge={tr.checkout.free}
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
            badge={tr.checkout.free}
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
              <option value="-1">{tr.checkout.pickupFallback}</option>
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
                <div className="relative">
                  <select value={postaDelivery.regionId || ""} onChange={(e) => setPostaDelivery({ ...postaDelivery, regionId: Number(e.target.value) })} required className={inputCls}>
                    <option value="" disabled>{tr.checkout.selectRegion}</option>
                    {postaRegions.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                  </select>
                  {postaListsLoading.regions && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#63ad36]" />}
                </div>
                <div className="relative">
                  <select value={postaDelivery.cityId || ""} onChange={(e) => setPostaDelivery({ ...postaDelivery, cityId: Number(e.target.value) })} required disabled={!postaDelivery.regionId} className={`${inputCls} disabled:opacity-50`}>
                    <option value="" disabled>{tr.checkout.city}</option>
                    {postaCities.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                  {postaListsLoading.cities && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#63ad36]" />}
                </div>
                <div className="relative">
                  <input
                    type="text" placeholder={tr.checkout.address} required value={postaDelivery.street}
                    onChange={(e) => { setPostaDelivery({ ...postaDelivery, street: e.target.value }); setStreetSearch(e.target.value.toLowerCase()); setPostaStreetId(0); setStreetOpen(true); }}
                    onFocus={() => { if (postaStreets.length > 0) setStreetOpen(true); }}
                    onBlur={() => setTimeout(() => setStreetOpen(false), 300)}
                    className={inputCls}
                  />
                  {postaListsLoading.streets && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#63ad36]" />}
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
          <OptionRow
            selected={payChoice === "RATE"}
            disabled={!iuteEnabled}
            comingSoon={!iuteEnabled}
            icon={Percent}
            label={tr.cart.payInstallments}
            badge={iuteEnabled ? tr.checkout.zeroInterest : tr.checkout.comingSoon}
            onClick={() => setPayChoice("RATE")}
          />
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
            </div>
          </div>
        )}
      </Section>

      {/* ===== DATE CONTACT ===== */}
      <Section icon={Building2} title={tr.checkout.contactDetails}>
        <div className="grid gap-2.5">
          <input type="text" placeholder={tr.checkout.fullName} required value={contact.full_name} onChange={(e) => setContact({ ...contact, full_name: e.target.value })} className={inputCls} />
          <input type="tel" placeholder={tr.checkout.phone} required value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={inputCls} />
          <input type="email" placeholder={payChoice === "RATE" ? tr.checkout.email : tr.checkout.emailOptional} required={payChoice === "RATE"} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={inputCls} />
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
          <span className="font-semibold text-[#1d1d1f]">{formatPrice(total)} {tr.rates.currency}</span>
        </div>
        <div className="mt-1.5 flex justify-between text-[13px]">
          <span className="text-[#34781f]">{tr.cart.deliveryFree}</span>
          <span className="font-bold text-[#34781f]">0 {tr.rates.currency}</span>
        </div>
        <div className="mt-3 border-t border-[#e4e8e4] pt-3 flex justify-between text-[17px] font-bold text-[#1d1d1f]">
          <span>{tr.cart.total}</span>
          <span>{formatPrice(total)} {tr.rates.currency}</span>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[12px] leading-[1.4] text-[#536070]">
          <input
            type="checkbox"
            required
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#63ad36]"
          />
          <span>
            {tr.checkout.agreeTerms}{" "}
            <Link href={`/${locale}/termeni-si-conditii`} target="_blank" className="font-semibold text-[#34781f] underline hover:text-[#1d1d1f]">
              {tr.footer.terms}
            </Link>
          </span>
        </label>

        {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !hasSelected || !termsAccepted}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] py-3.5 text-[15px] font-bold text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (<><Loader2 className="h-5 w-5 animate-spin" /> {tr.checkout.processing}</>) : (tr.cart.finalizeOrder)}
        </button>

        {!hasSelected && <p className="mt-2 text-center text-[11px] text-[#6b6c6c]">{tr.cart.selectAtLeastOne}</p>}
      </div>
    </form>
  );
}
