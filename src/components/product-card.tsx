"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";

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
  const { toggleFavorite, isFavorite } = useFavorites();
  const unitId = product.unit_id || product.id;
  const hasPrice = product.price > 0;
  const href = `/product/${product.slug ? `${product.id}-${product.slug}` : product.id}`;

  return (
    <article className="group relative flex flex-col rounded-[9px] border border-[#e4e8e4] bg-white p-[14px] transition-all hover:-translate-y-[3px] hover:border-[#cfd9e6] hover:shadow-[0_18px_38px_rgba(31,41,55,0.10)]">
      {product.badge && (
        <span className={`mb-2 inline-block self-start rounded-[7px] px-[9px] py-[4px] text-[10px] font-black uppercase leading-none tracking-wide ${product.badge_type === "blue" ? "bg-[#eaf2ff] text-[#1769e8]" : "bg-[#edf7e8] text-[#34781f]"}`}>
          {product.badge}
        </span>
      )}

      <Link href={href} className="relative mb-[10px] block h-[140px] overflow-hidden rounded-[7px] bg-[#f3f6f6]">
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
        <button
          onClick={(e) => { e.preventDefault(); toggleFavorite({ product_id: product.id, name: product.name, price: product.price, image_url: product.image_url }); }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-colors hover:bg-white"
          aria-label="Adaugă la favorite"
        >
          <Heart className={`h-4 w-4 transition-colors ${isFavorite(product.id) ? "fill-[#b64400] text-[#b64400]" : "text-[#6b6c6c]"}`} />
        </button>
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
            <strong className="block text-[22px] font-extrabold leading-none text-[#34781f]">
              {product.price.toFixed(0)} <small className="text-[13px]">MDL</small>
            </strong>
            {product.old_price && product.old_price > product.price && (
              <span className="text-sm text-[#6b6c6c] line-through">{product.old_price.toFixed(0)} MDL</span>
            )}
            <p className="mt-[3px] mb-[10px] text-[12.5px] text-[#6b6c6c]">de la 0% în rate</p>
          </>
        ) : (
          <p className="mb-[10px] text-sm font-medium text-[#6b6c6c]">Preț la cerere</p>
        )}

        <button
          onClick={() => addItem({ product_id: product.id, unit_id: unitId, name: product.name, price: product.price, qty: 1, image: product.image_url, stock: product.stock || 0 })}
          className="flex w-full items-center justify-center gap-1.5 rounded-[7px] border-[1.5px] border-[#63ad36] py-[9px] text-[13px] font-semibold text-[#34781f] transition-colors hover:bg-[#edf7e8] disabled:opacity-40"
          disabled={!hasPrice}
        >
          <ShoppingCart className="h-4 w-4" />
          {hasPrice ? "Adaugă în coș" : "Indisponibil"}
        </button>
      </div>
    </article>
  );
}
