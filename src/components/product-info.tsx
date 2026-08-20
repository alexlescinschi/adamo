"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { useResolveUnit } from "@/hooks/use-resolve-unit";
import { ShoppingCart, Loader2, Minus, Plus, Truck, ChevronDown, Info } from "lucide-react";
import { useLocale, useTranslations } from "@/hooks/use-translations";
import { RateCalculator } from "@/components/rate-calculator";
import { formatPrice } from "@/lib/utils";

interface ProductInfoProps {
  product: any;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const { buyNow, addItem } = useCart();
  const resolveUnit = useResolveUnit();
  const tr = useTranslations();
  const locale = useLocale();
  const [adding, setAdding] = useState(false);
  const [qty, setQty] = useState(1);
  const [rateOpen, setRateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [iuteRates, setIuteRates] = useState<{
    smart4: number | null;
    smart6: number | null;
    flexi: number | null;
    plans: { months: number; monthlyPayment: number; kind: "smart" | "flexi" }[];
  } | null>(null);

  const hasPrice = product.price > 0;
  const stock = product.units_total ?? 0;

  useEffect(() => {
    if (!hasPrice) return;
    fetch(`/api/payments/iute/calculations?price=${product.price}&productId=${product.id}`)
      .then((response) => response.ok ? response.json() : null)
      .then(setIuteRates)
      .catch(() => setIuteRates(null));
  }, [product.id, product.price, hasPrice]);

  const handleAddToCart = async () => {
    if (qty > stock) {
      setToast(tr.product.outOfStock);
      return;
    }
    setAdding(true);
    try {
      const unit_id = await resolveUnit(product);
      addItem({ product_id: product.id, unit_id, name: product.name, price: product.price, old_price: product.old_price, qty, image: product.image_url, stock });
      setToast(tr.product.addedToCart);
      setTimeout(() => setToast(null), 2500);
    } finally {
      setAdding(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleBuy = async (payment?: "CASH" | "RATE") => {
    setAdding(true);
    try {
      const unit_id = await resolveUnit(product);
      buyNow(
        { product_id: product.id, unit_id, name: product.name, price: product.price, old_price: product.old_price, qty, image: product.image_url, stock },
        payment,
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <div data-testid="product-info">
      {product.category_slug && (
        <Link href={`/${locale}/category/${product.category_slug}`} className="text-sm text-[#4e8f28] hover:underline mb-2 block">
          {product.category_name || product.category_slug}
        </Link>
      )}
      <h1 className="text-[34px] font-medium leading-tight tracking-[-0.031em] text-[#1d1d1f]">{product.name}</h1>
      {product.product_code && (
        <p className="mt-2 text-[13px] text-[#6b6c6c]">{tr.product.scanCode}: {product.product_code}</p>
      )}
      {product.availability === "OutOfStock" && (
        <span className="mt-3 inline-block text-xs font-medium text-[#b64400]">{tr.product.outOfStock}</span>
      )}

      <div className="mt-6">
        {hasPrice ? (
          <div className="grid grid-cols-[136px_minmax(0,1fr)] gap-x-3 gap-y-0.5">
            {product.old_price && product.old_price > product.price && (
              <span data-testid="old-price" className="col-start-1 row-start-1 text-lg text-[#6b6c6c] line-through whitespace-nowrap">{formatPrice(product.old_price)} {tr.rates.currency}</span>
            )}
            <span data-testid="current-price" className="col-start-1 row-start-2 whitespace-nowrap text-[28px] font-extrabold text-[#1d1d1f]">{formatPrice(product.price)} {tr.rates.currency}</span>
            {product.condition && (
              <span
                data-testid="condition-badge"
                className={`col-start-2 row-start-2 self-center justify-self-center rounded-[6px] px-3 py-1.5 text-[12px] font-black uppercase text-white shadow-[0_3px_10px_rgba(31,41,55,0.18)] ${product.condition === "new" ? "bg-gradient-to-r from-[#6fa9e0] to-[#3979b7]" : "bg-[#3979b7]"}`}
              >
                {(tr as any).badges[product.condition]}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-[10px]">
            <span className="text-lg font-medium text-[#6b6c6c]">{tr.product.priceOnRequest}</span>
            {product.condition && (
              <span
                data-testid="condition-badge"
                className={`shrink-0 rounded-[6px] px-3 py-1.5 text-[12px] font-black uppercase text-white shadow-[0_3px_10px_rgba(31,41,55,0.18)] ${product.condition === "new" ? "bg-gradient-to-r from-[#6fa9e0] to-[#3979b7]" : "bg-[#3979b7]"}`}
              >
                {(tr as any).badges[product.condition]}
              </span>
            )}
          </div>
        )}
      </div>

      {stock > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-[13px] text-[#6b6c6c]">{tr.product.stock}: {stock}</span>
          {stock === 1 && (
            <span className="rounded-full bg-[#ffe0e0] px-2.5 py-0.5 text-[11px] font-bold uppercase text-[#b64400]">
              {tr.product.lastOne}
            </span>
          )}
        </div>
      )}

      {stock > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="grid h-[50px] grid-cols-[136px_minmax(0,1fr)] gap-3">
            <div className="flex h-[50px] items-stretch rounded-[8px] border border-[#cccfcf]">
              <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="flex items-center px-4 text-[#1d1d1f] hover:bg-[#f3f6f6] transition-colors">
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex items-center justify-center min-w-[40px] text-[14px] font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => {
                  if (qty >= stock) showToast(tr.product.outOfStock);
                  else setQty(q => Math.min(stock, q + 1));
                }}
                className="flex items-center px-4 text-[#1d1d1f] hover:bg-[#f3f6f6] transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!hasPrice || product.availability === "OutOfStock" || adding}
              className="flex items-center justify-center gap-2 rounded-[9px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 text-[15px] font-semibold text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-40"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              {tr.product.addToCart}
            </button>
          </div>
          {toast && (
            <div className="flex items-center gap-1.5 rounded-[6px] bg-[#edf7e8] px-3 py-1.5 text-[12px] font-medium text-[#34781f] animate-in fade-in">
              <Info className="h-3.5 w-3.5" />
              {toast}
            </div>
          )}
        </div>
      )}

      {/* ===== COMANDA + ACHITA BUTOANE ===== */}
      <div className="mt-3 space-y-2.5">
        {/* Comandă într-un clic — buyNow, deschide coșul */}
        {stock > 0 && (
          <button
            onClick={() => handleBuy("CASH")}
            disabled={!hasPrice || product.availability === "OutOfStock" || adding}
            className="flex min-h-[64px] w-full items-center gap-3 rounded-[12px] border-2 border-[#63ad36] bg-[#edf7e8] px-4 py-3 text-left transition-colors hover:bg-[#daf0d2] disabled:opacity-40 sm:min-h-[50px] sm:px-5 sm:py-2"
          >
            <Truck className="h-5 w-5 flex-shrink-0 text-[#34781f]" />
            <div className="min-w-0">
              <span className="text-[15px] font-bold leading-tight text-[#34781f]">{tr.product.orderNow}</span>
              <span className="mt-1 block text-[11px] leading-snug text-[#4e8f28]">{tr.product.orderNowSub}</span>
            </div>
          </button>
        )}

        <div className="overflow-hidden rounded-[12px] bg-gradient-to-r from-[#3d9a2e] to-[#2e7d22] text-white">
          <button
            onClick={() => setRateOpen(!rateOpen)}
            disabled={!hasPrice || product.availability === "OutOfStock"}
            className="h-[50px] w-full px-5 transition-all hover:from-[#2e7d22] hover:to-[#236b1a] disabled:opacity-40"
          >
            <div className="flex items-center gap-3">
              <img src="/coins.svg" alt="" className="h-5 w-5 flex-shrink-0 brightness-0 invert" />
              <div className="flex-1 text-left">
                <span className="text-[15px] font-bold">{tr.product.payInstallments}</span>
                <span className="block text-[11px] font-normal opacity-80">{tr.product.installmentSub}</span>
              </div>
              <ChevronDown className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${rateOpen ? "rotate-180" : ""}`} />
            </div>
          </button>
          <div className={`transition-all duration-300 ${rateOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="space-y-1.5 px-5 pb-3">
              {iuteRates ? (
                <>
                  {iuteRates.smart4 && <button data-testid="iute-plan-smart-4" onClick={() => handleBuy("RATE")} disabled={!hasPrice || product.availability === "OutOfStock" || adding} className="flex w-full items-center justify-between rounded-[8px] bg-white/15 px-3 py-2 transition-colors hover:bg-white/25 disabled:opacity-40">
                    <div className="text-left">
                      <span className="text-[13px] font-semibold">Smart 0%</span>
                      <span className="block text-[10px] opacity-70">{tr.rates.smartDescription}</span>
                    </div>
                    <span className="text-[14px] font-bold">{formatPrice(iuteRates.smart4)} <small className="text-[10px] font-normal">{tr.product.perMonthShort}</small></span>
                  </button>}
                  {iuteRates.smart6 && <button data-testid="iute-plan-smart-6" onClick={() => handleBuy("RATE")} disabled={!hasPrice || product.availability === "OutOfStock" || adding} className="flex w-full items-center justify-between rounded-[8px] bg-white/15 px-3 py-2 transition-colors hover:bg-white/25 disabled:opacity-40">
                    <div className="text-left">
                      <span className="text-[13px] font-semibold">Smart 0%</span>
                      <span className="block text-[10px] opacity-70">{tr.rates.smartSixDescription}</span>
                    </div>
                    <span className="text-[14px] font-bold">{formatPrice(iuteRates.smart6)} <small className="text-[10px] font-normal">{tr.product.perMonthShort}</small></span>
                  </button>}
                  {iuteRates.flexi && (
                    <button data-testid="iute-plan-flexi" onClick={() => handleBuy("RATE")} disabled={!hasPrice || product.availability === "OutOfStock" || adding} className="flex w-full items-center justify-between rounded-[8px] bg-white/15 px-3 py-2 transition-colors hover:bg-white/25 disabled:opacity-40">
                      <div className="text-left">
                        <span className="text-[13px] font-semibold">Flexi Shop</span>
                        <span className="block text-[10px] opacity-70">{tr.rates.flexiDescription}</span>
                      </div>
                      <span className="text-[14px] font-bold">{tr.product.from} {formatPrice(iuteRates.flexi)} <small className="text-[10px] font-normal">{tr.product.perMonthShort}</small></span>
                    </button>
                  )}
                  <p className="pt-1 text-[10px] font-normal opacity-60">{tr.product.partialSub}</p>
                </>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2"><Loader2 className="h-4 w-4 animate-spin opacity-50" /><span className="text-[12px] opacity-50">{tr.product.ratesLoading}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>

      <RateCalculator price={product.price} plans={iuteRates?.plans} />

      {product.description && (
        <div className="mt-6 text-[17px] leading-relaxed text-[#6b6c6c] whitespace-pre-line">{product.description}</div>
      )}

      {Object.keys(product.specs || {}).length > 0 && (
        <div className="mt-[70px]">
          <h2 className="text-xl font-semibold mb-6 text-[#1d1d1f]">{tr.product.specs}</h2>
          <div className="rounded-[28px] border border-[#cccfcf]/50 divide-y divide-[#cccfcf]/50 overflow-hidden">
            {Object.entries(product.specs).map(([key, value]) => (
              <div key={key} className="flex justify-between px-6 py-4">
                <span className="text-sm text-[#6b6c6c] capitalize">{key.replace(/_/g, " ")}</span>
                <span className="text-sm font-medium text-[#1d1d1f]">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
