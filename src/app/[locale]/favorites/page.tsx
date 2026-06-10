"use client";

import Link from "next/link";
import Image from "next/image";
import { useFavorites } from "@/hooks/use-favorites";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useTranslations } from "@/hooks/use-translations";

export default function FavoritesPage() {
  const { items, removeFavorite } = useFavorites();
  const { addItem } = useCart();
  const tr = useTranslations();

  if (items.length === 0) {
    return (
      <div className="py-[70px] text-center">
        <Heart className="mx-auto h-10 w-10 text-[#cccfcf]" />
        <h1 className="mt-4 text-[28px] font-semibold text-[#1d1d1f]">Favorite</h1>
        <p className="mt-2 text-sm text-[#6b6c6c]">Nu ai produse favorite încă.</p>
        <Link href="/" className="mt-6 inline-block rounded-[28px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-3 text-sm font-medium text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all">
          Descoperă produse
        </Link>
      </div>
    );
  }

  return (
    <div className="py-[70px]">
      <h1 className="text-[28px] font-semibold text-[#1d1d1f] mb-8">Favorite</h1>
      <div className="grid grid-cols-2 gap-[14px] md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.product_id} className="group relative flex flex-col rounded-[28px] bg-white p-[14px] transition-shadow hover:shadow-sm border border-[#cccfcf]/30">
            <Link href={`/product/${item.product_id}`} className="relative aspect-square overflow-hidden rounded-[14px] md:rounded-[28px] bg-[#f3f6f6]">
              {item.image_url ? (
                <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#6b6c6c]">Fără imagine</div>
              )}
            </Link>
            <div className="mt-3 flex flex-1 flex-col px-1">
              <Link href={`/product/${item.product_id}`} className="text-sm font-medium text-[#1d1d1f] line-clamp-2 hover:text-[#4e8f28] transition-colors">
                {item.name}
              </Link>
              <div className="mt-2 flex items-baseline gap-2">
                {item.price > 0 ? (
                  <span className="text-base font-semibold text-[#1d1d1f]">{item.price.toFixed(0)} MDL</span>
                ) : (
                  <span className="text-sm font-medium text-[#6b6c6c]">{tr.product.priceOnRequest}</span>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => addItem({ product_id: item.product_id, unit_id: item.product_id, name: item.name, price: item.price, qty: 1, image: item.image_url, stock: 0 })}
                  disabled={item.price <= 0}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-[28px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] py-2 text-xs font-medium text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-50"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Coș
                </button>
                <button onClick={() => removeFavorite(item.product_id)} className="rounded-[28px] border border-[#cccfcf]/50 p-2 text-[#6b6c6c] hover:text-[#b64400] hover:border-[#b64400]/30 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
