"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  images: { url: string }[];
  name: string;
}

export function ImageGallery({ images, name }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const touchStart = useRef(0);

  const prev = () => setSelected((s) => (s - 1 + images.length) % images.length);
  const next = () => setSelected((s) => (s + 1) % images.length);

  if (images.length === 0) {
    return <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[14px] md:rounded-[28px] bg-[#f3f6f6] text-[#6b6c6c]">Fără imagine</div>;
  }

  return (
    <div>
      <div
        className="relative w-full aspect-[4/3] overflow-hidden rounded-[14px] md:rounded-[28px] bg-[#f3f6f6]"
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStart.current - e.changedTouches[0].clientX;
          if (diff > 40) next();
          else if (diff < -40) prev();
        }}
      >
        <Image key={images[selected]?.url} src={images[selected]?.url} alt={name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />

        {images.length > 1 && (
          <>
            <button onClick={prev} className="hidden sm:block absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-sm hover:bg-white transition-colors">
              <ChevronLeft className="h-5 w-5 text-[#1d1d1f]" />
            </button>
            <button onClick={next} className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-sm hover:bg-white transition-colors">
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
