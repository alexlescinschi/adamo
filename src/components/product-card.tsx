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
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const unitId = product.unit_id || product.id;
  const hasPrice = product.price > 0;

  return (
    <div className="group relative flex flex-col rounded-lg border border-slate-200 bg-white p-3 transition-shadow hover:shadow-md">
      <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden rounded-md bg-slate-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400 text-sm">Fără imagine</div>
        )}
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        <Link href={`/product/${product.id}`} className="text-sm font-medium text-slate-900 line-clamp-2 hover:underline">
          {product.name}
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          {hasPrice ? (
            <>
              <span className="text-base font-bold text-slate-900">{product.price.toFixed(2)} MDL</span>
              {product.old_price && product.old_price > product.price && (
                <span className="text-sm text-slate-400 line-through">{product.old_price.toFixed(2)} MDL</span>
              )}
            </>
          ) : (
            <span className="text-sm font-medium text-slate-600">Preț la cerere</span>
          )}
        </div>
        <button
          onClick={() =>
            addItem({
              product_id: product.id,
              unit_id: unitId,
              name: product.name,
              price: product.price,
              qty: 1,
              image: product.image_url,
            })
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          disabled={!hasPrice}
        >
          <ShoppingCart className="h-4 w-4" />
          {hasPrice ? "Adaugă în coș" : "Indisponibil"}
        </button>
      </div>
    </div>
  );
}
