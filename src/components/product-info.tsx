"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { ShoppingCart, CheckCircle } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { RateCalculator } from "@/components/rate-calculator";

interface ProductInfoProps {
  product: any;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const { addItem } = useCart();
  const tr = useTranslations();
  const [added, setAdded] = useState(false);

  const hasPrice = product.price > 0;

  const handleAddToCart = () => {
    if (!hasPrice) return;
    addItem({ product_id: product.id, unit_id: product.id, name: product.name, price: product.price, qty: 1, image: product.image_url, stock: product.units_total });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div>
      {product.category_slug && (
        <Link href={`/category/${product.category_slug}`} className="text-sm text-[#4e8f28] hover:underline mb-2 block">
          {product.category_name || product.category_slug}
        </Link>
      )}
      <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.031em] text-[#1d1d1f]">{product.name}</h1>
      {product.availability === "OutOfStock" && (
        <span className="mt-3 inline-block text-xs font-medium text-[#b64400]">{tr.product.outOfStock}</span>
      )}

      <div className="mt-6">
        {hasPrice ? (
          <div className="flex items-baseline gap-3">
            <span className="text-[28px] font-semibold text-[#1d1d1f]">{product.price.toFixed(0)} MDL</span>
            {product.old_price && product.old_price > product.price && (
              <span className="text-lg text-[#6b6c6c] line-through">{product.old_price.toFixed(0)} MDL</span>
            )}
          </div>
        ) : (
          <span className="text-lg font-medium text-[#6b6c6c]">{tr.product.priceOnRequest}</span>
        )}
      </div>

      <RateCalculator price={product.price} productName={product.name} />

      <button
        onClick={handleAddToCart}
        disabled={!hasPrice || product.availability === "OutOfStock"}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] md:rounded-[28px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] py-4 text-[16px] md:text-[17px] font-medium text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {added ? (
          <><CheckCircle className="h-5 w-5" /> {tr.product.addedToCart}</>
        ) : (
          <><ShoppingCart className="h-5 w-5" /> {hasPrice ? tr.product.addToCart : tr.product.unavailable}</>
        )}
      </button>

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
