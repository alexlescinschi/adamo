"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

interface Product {
  id: number;
  name: string;
  price: number;
  old_price?: number;
  image_url?: string;
  unit_id?: number;
  slug?: string;
  stock?: number;
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const unitId = product.unit_id || product.id;
  const hasPrice = product.price > 0;

  return (
    <div className="group relative flex flex-col rounded-[28px] bg-white p-[14px] transition-shadow hover:shadow-sm">
      <Link href={`/product/${product.slug ? `${product.id}-${product.slug}` : product.id}`} className="relative aspect-square overflow-hidden rounded-[14px] md:rounded-[28px] bg-[#f3f6f6]">
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
      <div className="mt-3 flex flex-1 flex-col px-1">
        <Link href={`/product/${product.slug ? `${product.id}-${product.slug}` : product.id}`} className="text-sm font-medium text-[#1d1d1f] line-clamp-2 hover:text-[#0066cc] transition-colors">
          {product.name}
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          {hasPrice ? (
            <>
              <span className="text-base font-semibold text-[#1d1d1f]">{product.price.toFixed(0)} MDL</span>
              {product.old_price && product.old_price > product.price && (
                <span className="text-sm text-[#6b6c6c] line-through">{product.old_price.toFixed(0)} MDL</span>
              )}
            </>
          ) : (
            <span className="text-sm font-medium text-[#6b6c6c]">Preț la cerere</span>
          )}
        </div>
        <button
          onClick={() => addItem({ product_id: product.id, unit_id: unitId, name: product.name, price: product.price, qty: 1, image: product.image_url, stock: product.stock || 0 })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[28px] bg-[#0071e3] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0066cc] disabled:opacity-50"
          disabled={!hasPrice}
        >
          <ShoppingCart className="h-4 w-4" />
          {hasPrice ? "Adaugă în coș" : "Indisponibil"}
        </button>
      </div>
    </div>
  );
}
