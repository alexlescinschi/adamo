"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { ShoppingCart, CheckCircle, Heart } from "lucide-react";

interface ProductInfoProps {
  product: any;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
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
      <div className="flex items-start gap-3">
        <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.031em] text-[#1d1d1f] flex-1">{product.name}</h1>
        <button onClick={() => toggleFavorite({ product_id: product.id, name: product.name, price: product.price, image_url: product.image_url })} className="mt-1 flex-shrink-0 rounded-full p-2 transition-colors hover:bg-[#f3f6f6]">
          <Heart className={`h-6 w-6 transition-colors ${isFavorite(product.id) ? "fill-[#b64400] text-[#b64400]" : "text-[#cccfcf]"}`} />
        </button>
      </div>
      {product.availability === "OutOfStock" && (
        <span className="mt-3 inline-block text-xs font-medium text-[#b64400]">Stoc epuizat</span>
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
          <span className="text-lg font-medium text-[#6b6c6c]">Preț la cerere</span>
        )}
      </div>

      {product.description && (
        <div className="mt-6 text-[17px] leading-relaxed text-[#6b6c6c] whitespace-pre-line">{product.description}</div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={!hasPrice || product.availability === "OutOfStock"}
        className="mt-[70px] flex w-full items-center justify-center gap-2 rounded-[14px] md:rounded-[28px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-3.5 text-[17px] font-medium text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {added ? (
          <><CheckCircle className="h-5 w-5" /> Adăugat în coș</>
        ) : (
          <><ShoppingCart className="h-5 w-5" /> {hasPrice ? "Adaugă în coș" : "Indisponibil"}</>
        )}
      </button>

      {Object.keys(product.specs || {}).length > 0 && (
        <div className="mt-[70px]">
          <h2 className="text-xl font-semibold mb-6 text-[#1d1d1f]">Specificații</h2>
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
