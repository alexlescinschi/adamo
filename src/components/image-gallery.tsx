"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";

interface FavoriteData {
  productId: number;
  name: string;
  price: number;
  imageUrl: string | null;
}

interface ImageGalleryProps {
  images: { url: string }[];
  name: string;
  favorite?: FavoriteData;
}

export function ImageGallery({ images, name, favorite }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const { toggleFavorite, isFavorite } = useFavorites();

  if (images.length === 0) {
    return <div className="flex h-80 items-center justify-center rounded-[14px] md:rounded-[28px] bg-[#f3f6f6] text-[#6b6c6c]">Fără imagine</div>;
  }

  return (
    <div>
      <div className="relative w-full aspect-square overflow-hidden rounded-[14px] md:rounded-[28px] bg-[#f3f6f6]">
        <Image src={images[selected]?.url} alt={name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />

        {/* Favorite button overlay */}
        {favorite && (
          <button
            onClick={() => toggleFavorite({ product_id: favorite.productId, name: favorite.name, price: favorite.price, image_url: favorite.imageUrl ?? undefined })}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          >
            <Heart className={`h-5 w-5 transition-colors ${isFavorite(favorite.productId) ? "fill-[#b64400] text-[#b64400]" : "text-[#6b6c6c]"}`} />
          </button>
        )}

        {images.length > 1 && (
          <>
            <button onClick={() => setSelected((selected - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-sm hover:bg-white transition-colors">
              <ChevronLeft className="h-5 w-5 text-[#1d1d1f]" />
            </button>
            <button onClick={() => setSelected((selected + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-sm hover:bg-white transition-colors">
              <ChevronRight className="h-5 w-5 text-[#1d1d1f]" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">{selected + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-[10px] flex gap-[10px] overflow-x-auto">
          {images.map((img: any, i: number) => (
            <button key={i} onClick={() => setSelected(i)} className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-[12px] border-2 transition-colors ${i === selected ? "border-[#63ad36]" : "border-transparent opacity-50 hover:opacity-100"}`}>
              <Image src={img.url} alt="" fill className="object-cover" sizes="56px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
