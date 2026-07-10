"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { useResolveUnit } from "@/hooks/use-resolve-unit";
import { ShoppingCart, Loader2, Check, Minus, Plus, Truck, ChevronDown } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { RateCalculator } from "@/components/rate-calculator";
import { IuteCalculator } from "@/components/iute-calculator";
import { formatPrice } from "@/lib/utils";

interface ProductInfoProps {
  product: any;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const { buyNow } = useCart();
  const resolveUnit = useResolveUnit();
  const tr = useTranslations();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [rateOpen, setRateOpen] = useState(false);
  const [iuteRates, setIuteRates] = useState<{ smart: number; smartDesc: string; flexi: number | null; flexiDesc: string } | null>(null);

  const hasPrice = product.price > 0;
  const stock = product.units_total ?? 0;

  // ponytail: fetch real IutePay rates (Smart 0% from math, Flexi from live API)
  useEffect(() => {
    if (!hasPrice) return;
    fetch(`/api/payments/iute/calculations?price=${product.price}`)
      .then((r) => r.json())
      .then(setIuteRates)
      .catch(() => {});
  }, [product.price, hasPrice]);

  const handleBuy = async (payment?: "CASH" | "RATE") => {
    setAdding(true);
    try {
      const unit_id = await resolveUnit(product);
      buyNow(
        { product_id: product.id, unit_id, name: product.name, price: product.price, qty, image: product.image_url, stock },
        payment,
      );
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      {product.category_slug && (
        <Link href={`/category/${product.category_slug}`} className="text-sm text-[#4e8f28] hover:underline mb-2 block">
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
          <div className="flex items-baseline gap-3">
            <span className="text-[28px] font-extrabold text-[#1d1d1f]">{formatPrice(product.price)} MDL</span>
            {product.old_price && product.old_price > product.price && (
              <span className="text-lg text-[#6b6c6c] line-through whitespace-nowrap">{formatPrice(product.old_price)} MDL</span>
            )}
          </div>
        ) : (
          <span className="text-lg font-medium text-[#6b6c6c]">{tr.product.priceOnRequest}</span>
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
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center rounded-[8px] border border-[#cccfcf]">
            <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-1.5 text-[#1d1d1f] hover:bg-[#f3f6f6] transition-colors">
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-[36px] text-center text-[13px] font-semibold">{qty}</span>
            <button type="button" onClick={() => setQty(q => Math.min(stock, q + 1))} className="px-3 py-1.5 text-[#1d1d1f] hover:bg-[#f3f6f6] transition-colors">
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <span className="text-[13px] font-semibold text-[#1d1d1f]">{formatPrice(product.price * qty)} MDL</span>
        </div>
      )}

      <RateCalculator price={product.price} productName={product.name} />
      <IuteCalculator price={product.price} sku={String(product.id)} />

      {/* ===== 3 BUTOANE VERZI ===== */}
      <div className="mt-4 space-y-2.5">
        {/* 1. Cumpără */}
        <button
          onClick={() => handleBuy("CASH")}
          disabled={!hasPrice || product.availability === "OutOfStock" || adding}
          className="w-full rounded-[12px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-5 py-3.5 text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-40"
        >
          <div className="flex items-start gap-3">
            <ShoppingCart className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <span className="text-[15px] font-bold">{added ? tr.product.addedToCart : tr.product.buyNow}</span>
              <span className="block text-[11px] font-normal opacity-80">{tr.product.buyNowSub}</span>
            </div>
          </div>
        </button>

        {/* 2. Comandă */}
        <button
          onClick={() => handleBuy("CASH")}
          disabled={!hasPrice || product.availability === "OutOfStock" || adding}
          className="w-full rounded-[12px] bg-gradient-to-r from-[#55a02d] to-[#4a8f25] px-5 py-3.5 text-white hover:from-[#4a8f25] hover:to-[#3e7a1f] transition-all disabled:opacity-40"
        >
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <span className="text-[15px] font-bold">{tr.product.orderNow}</span>
              <span className="block text-[11px] font-normal opacity-80">{tr.product.orderNowSub}</span>
            </div>
          </div>
        </button>

        {/* 3. Achită în rate (IutePay) — expandabil */}
        <div className="rounded-[12px] bg-gradient-to-r from-[#3d9a2e] to-[#2e7d22] text-white overflow-hidden">
          <button
            onClick={() => setRateOpen(!rateOpen)}
            disabled={!hasPrice || product.availability === "OutOfStock"}
            className="w-full px-5 py-3.5 hover:from-[#2e7d22] hover:to-[#236b1a] transition-all disabled:opacity-40"
          >
            <div className="flex items-center gap-3">
              <img src="/coins.svg" alt="" className="h-5 w-5 flex-shrink-0 brightness-0 invert" />
              <div className="text-left flex-1">
                <span className="text-[15px] font-bold">{tr.product.payInstallments}</span>
                <span className="block text-[11px] font-normal opacity-80">{tr.product.installmentSub}</span>
              </div>
              <ChevronDown className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${rateOpen ? "rotate-180" : ""}`} />
            </div>
          </button>
          <div className={`transition-all duration-300 ${rateOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="px-5 pb-3 space-y-1.5">
              {iuteRates ? (
                <>
                  <button
                    onClick={() => handleBuy("RATE")}
                    disabled={!hasPrice || product.availability === "OutOfStock" || adding}
                    className="w-full flex items-center justify-between rounded-[8px] bg-white/15 hover:bg-white/25 px-3 py-2 transition-colors disabled:opacity-40"
                  >
                    <div className="text-left">
                      <span className="text-[13px] font-semibold">Smart 0%</span>
                      <span className="block text-[10px] opacity-70">{iuteRates.smartDesc}</span>
                    </div>
                    <span className="text-[14px] font-bold">{formatPrice(iuteRates.smart)} <small className="text-[10px] font-normal">MDL/lună</small></span>
                  </button>
                  {iuteRates.flexi ? (
                    <button
                      onClick={() => handleBuy("RATE")}
                      disabled={!hasPrice || product.availability === "OutOfStock" || adding}
                      className="w-full flex items-center justify-between rounded-[8px] bg-white/15 hover:bg-white/25 px-3 py-2 transition-colors disabled:opacity-40"
                    >
                      <div className="text-left">
                        <span className="text-[13px] font-semibold">Flexi Shop</span>
                        <span className="block text-[10px] opacity-70">{iuteRates.flexiDesc}</span>
                      </div>
                      <span className="text-[14px] font-bold">{formatPrice(iuteRates.flexi)} <small className="text-[10px] font-normal">MDL/lună</small></span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-[8px] bg-white/10 px-3 py-2">
                      <Loader2 className="h-3 w-3 animate-spin opacity-50" />
                      <span className="text-[11px] opacity-50">Flexi Shop — se încarcă...</span>
                    </div>
                  )}
                  <p className="text-[10px] font-normal opacity-60 pt-1">{tr.product.partialSub}</p>
                </>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                  <span className="text-[12px] opacity-50">Se încarcă ratele...</span>
                </div>
              )}
        </div>
      </div>

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
