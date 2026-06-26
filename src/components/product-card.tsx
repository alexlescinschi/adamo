"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useResolveUnit } from "@/hooks/use-resolve-unit";
import { useTranslations } from "@/hooks/use-translations";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  price: number;
  old_price?: number;
  image_url?: string;
  unit_id?: number;
  slug?: string;
  stock?: number;
  badge?: string;
  badge_type?: "green" | "blue";
  specs?: string[];
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const tr = useTranslations();
  const resolveUnit = useResolveUnit();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const hasPrice = product.price > 0;
  const href = `/product/${product.slug ? `${product.id}-${product.slug}` : product.id}`;

  const handleAdd = async () => {
    setAdding(true);
    try {
      const unit_id = await resolveUnit(product);
      addItem({ product_id: product.id, unit_id, name: product.name, price: product.price, qty: 1, image: product.image_url, stock: product.stock });
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="group relative flex flex-col rounded-[9px] border border-[#e4e8e4] bg-white p-[14px] transition-all hover:-translate-y-[3px] hover:border-[#cfd9e6] hover:shadow-[0_18px_38px_rgba(31,41,55,0.10)]">
      <Link href={href} className="relative mb-[10px] block aspect-[4/3] overflow-hidden rounded-[7px] bg-[#f3f6f6]">
        {product.badge && (
          <span className="absolute top-2 left-2 z-10 rounded-[6px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-2.5 py-1 text-[10px] font-black uppercase text-white shadow-[0_3px_10px_rgba(99,173,54,0.3)]">
            {product.badge}
          </span>
        )}
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#6b6c6c]">Fără imagine</div>
        )}
      </Link>

      <Link href={href} className="mb-[6px] text-[15px] font-extrabold leading-[1.2] text-[#1d1d1f] line-clamp-2 hover:text-[#34781f] transition-colors">
        {product.name}
      </Link>

      {product.specs && product.specs.length > 0 && (
        <ul className="mb-[8px] ml-[17px] list-disc p-0 text-[12px] leading-[1.42] text-[#526071]">
          {product.specs.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      )}

      <div className="mt-auto pt-2">
        {hasPrice ? (
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <strong className="block text-[25px] font-extrabold leading-none text-[#34781f] whitespace-nowrap">
                {formatPrice(product.price)} <small className="text-[13px]">MDL</small>
              </strong>
              {product.old_price && product.old_price > product.price && (
                <span className="block text-sm text-[#6b6c6c] line-through whitespace-nowrap">{formatPrice(product.old_price)} MDL</span>
              )}
              <p className="m-0 mt-[3px] text-[12.5px] font-medium text-[#1d1d1f]">
                {tr.product.installments}{" "}<img src="/iute_logo.svg" alt="iute" className="inline h-[1.1em] w-auto align-middle" />
              </p>
            </div>
            <button
              onClick={handleAdd}
              disabled={!hasPrice || adding}
              className={`grid place-items-center w-[38px] h-[38px] flex-shrink-0 rounded-[8px] border transition-[background,color,border-color,transform] duration-[.18s] hover:-translate-y-[1px] disabled:opacity-40 ${
                added
                  ? "border-[#55a02d] bg-gradient-to-b from-[#78bb45] to-[#55a02d] text-white"
                  : "border-[#63ad36] bg-white text-[#34781f] hover:bg-[#f6fbf2] hover:border-[#579c31]"
              }`}
              aria-label={tr.product.addToCart}
            >
              {added ? <Check className="h-5 w-5" /> : adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
            </button>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm font-medium text-[#6b6c6c]">{tr.product.priceOnRequest}</p>
            <button
              onClick={handleAdd}
              disabled={!hasPrice || adding}
              className={`grid place-items-center w-[38px] h-[38px] flex-shrink-0 rounded-[8px] border transition-[background,color,border-color,transform] duration-[.18s] hover:-translate-y-[1px] disabled:opacity-40 ${
                added
                  ? "border-[#55a02d] bg-gradient-to-b from-[#78bb45] to-[#55a02d] text-white"
                  : "border-[#63ad36] bg-white text-[#34781f] hover:bg-[#f6fbf2] hover:border-[#579c31]"
              }`}
              aria-label={tr.product.unavailable}
            >
              {added ? <Check className="h-5 w-5" /> : adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
