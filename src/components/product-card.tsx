"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useTranslations } from "@/hooks/use-translations";

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
  const unitId = product.unit_id || product.id;
  const hasPrice = product.price > 0;
  const href = `/product/${product.slug ? `${product.id}-${product.slug}` : product.id}`;

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
          <>
            <div className="flex flex-col gap-[3px] md:flex-row md:items-end md:justify-between md:gap-2">
              <div className="min-w-0">
                <strong className="text-[25px] font-extrabold leading-none text-[#34781f] whitespace-nowrap">
                  {product.price.toFixed(0)} <small className="text-[13px]">MDL</small>
                </strong>
                {product.old_price && product.old_price > product.price && (
                  <span className="text-sm text-[#34781f] line-through">{product.old_price.toFixed(0)} MDL</span>
                )}
                <span className="mt-[3px] inline-flex items-center gap-1 text-[12.5px] font-medium text-[#1d1d1f]">
                  {tr.product.installments} <img src="/iute_logo.svg" alt="iute" className="h-3.5 w-auto" />
                </span>
              </div>
              <button
                onClick={() => addItem({ product_id: product.id, unit_id: unitId, name: product.name, price: product.price, qty: 1, image: product.image_url, stock: product.stock })}
                className="flex w-full items-center justify-center gap-1.5 rounded-[7px] border-[1.5px] border-[#63ad36] px-3 py-[9px] text-[13px] font-semibold text-[#34781f] transition-colors hover:bg-[#edf7e8] disabled:opacity-40 md:w-auto md:flex-shrink-0"
                disabled={!hasPrice}
                aria-label={tr.product.addToCart}
              >
                <ShoppingCart className="h-4 w-4" />
                {tr.product.addToCart}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-[10px] text-sm font-medium text-[#6b6c6c]">{tr.product.priceOnRequest}</p>
            <button
              onClick={() => addItem({ product_id: product.id, unit_id: unitId, name: product.name, price: product.price, qty: 1, image: product.image_url, stock: product.stock })}
              className="flex w-full items-center justify-center gap-1.5 rounded-[7px] border-[1.5px] border-[#63ad36] py-[9px] text-[13px] font-semibold text-[#34781f] transition-colors hover:bg-[#edf7e8] disabled:opacity-40"
              disabled={!hasPrice}
            >
              <ShoppingCart className="h-4 w-4" />
              {tr.product.unavailable}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
