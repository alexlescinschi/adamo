"use client";

import Link from "next/link";
import { useFavorites } from "@/hooks/use-favorites";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product-card";

export default function FavoritesPage() {
  const { items } = useFavorites();

  if (items.length === 0) {
    return (
      <div className="py-[70px] text-center">
        <Heart className="mx-auto h-10 w-10 text-[#cccfcf]" />
        <h1 className="mt-4 text-[28px] font-semibold text-[#1d1d1f]">Favorite</h1>
        <p className="mt-2 text-sm text-[#6b6c6c]">Nu ai produse favorite încă.</p>
        <Link href="/" className="mt-6 inline-block rounded-[28px] border border-[#e4e8e4] px-6 py-3 text-sm font-semibold text-[#2d3542] transition-colors hover:border-[#63ad36] hover:text-[#34781f]">
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
          <ProductCard key={item.product_id} product={{
            id: item.product_id,
            name: item.name,
            price: item.price,
            image_url: item.image_url,
          }} />
        ))}
      </div>
    </div>
  );
}
