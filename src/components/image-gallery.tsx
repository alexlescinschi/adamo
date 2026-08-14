"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

interface ImageGalleryProps {
  images: { url: string }[];
  name: string;
}

export function ImageGallery({ images, name }: ImageGalleryProps) {
  const tr = useTranslations();
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const touchStart = useRef(0);
  const modalTouchStart = useRef({ x: 0, y: 0 });
  const swiped = useRef(false);

  const prev = () => setSelected((s) => (s - 1 + images.length) % images.length);
  const next = () => setSelected((s) => (s + 1) % images.length);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowLeft") setSelected((s) => (s - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setSelected((s) => (s + 1) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [images.length, open]);

  if (images.length === 0) {
    return <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[14px] md:rounded-[28px] bg-[#f3f6f6] text-[#6b6c6c]">{tr.product.noImage}</div>;
  }

  return (
    <div>
      <div
        data-testid="gallery-image-frame"
        className="relative w-full aspect-[4/3] overflow-hidden rounded-[14px] md:rounded-[28px] bg-[#f3f6f6]"
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; swiped.current = false; }}
        onTouchEnd={(e) => {
          const diff = touchStart.current - e.changedTouches[0].clientX;
          if (diff > 40) { swiped.current = true; next(); }
          else if (diff < -40) { swiped.current = true; prev(); }
        }}
      >
        <button
          type="button"
          aria-label={tr.product.openGallery}
          onClick={() => {
            if (swiped.current) { swiped.current = false; return; }
            setOpen(true);
          }}
          className="absolute inset-0 cursor-zoom-in"
        >
          <Image key={images[selected]?.url} src={images[selected]?.url} alt={name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
        </button>

        {images.length > 1 && (
          <>
            <button aria-label={tr.product.previousImage} onClick={prev} className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-sm transition-colors hover:bg-white sm:block">
              <ChevronLeft className="h-5 w-5 text-[#1d1d1f]" />
            </button>
            <button aria-label={tr.product.nextImage} onClick={next} className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-sm transition-colors hover:bg-white sm:block">
              <ChevronRight className="h-5 w-5 text-[#1d1d1f]" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <>
          <div data-testid="gallery-counter" className="mt-2 text-center text-xs font-medium text-[#6b6c6c]">{selected + 1} / {images.length}</div>
          <div className="mt-[10px] flex gap-[10px] overflow-x-auto">
            {images.map((img: any, i: number) => (
              <button key={i} onClick={() => setSelected(i)} className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-[12px] border-2 transition-colors ${i === selected ? "border-[#63ad36]" : "border-transparent opacity-50 hover:opacity-100"}`}>
                <Image src={img.url} alt="" fill className="object-cover" sizes="56px" />
              </button>
            ))}
          </div>
        </>
      )}
      {open && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={name}
          onClick={() => setOpen(false)}
          onTouchStart={(event) => {
            modalTouchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
          }}
          onTouchEnd={(event) => {
            const diffX = modalTouchStart.current.x - event.changedTouches[0].clientX;
            const diffY = modalTouchStart.current.y - event.changedTouches[0].clientY;
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
              if (diffX > 0) next();
              else prev();
            } else if (Math.abs(diffY) > 70) {
              setOpen(false);
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black touch-none"
        >
          <button
            type="button"
            aria-label={tr.product.closeGallery}
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-20 rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="flex h-full w-full flex-col">
            <div className="relative min-h-0 flex-1">
              <Image src={images[selected].url} alt={name} fill className="object-contain" sizes="100vw" priority />
              {images.length > 1 && (
                <>
                <button aria-label={tr.product.previousImage} onClick={(event) => { event.stopPropagation(); prev(); }} className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25 sm:left-4 sm:p-3">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button aria-label={tr.product.nextImage} onClick={(event) => { event.stopPropagation(); next(); }} className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25 sm:right-4 sm:p-3">
                  <ChevronRight className="h-6 w-6" />
                </button>
                </>
              )}
            </div>
            {images.length > 1 && <span data-testid="gallery-modal-counter" className="py-2 text-center text-sm text-white">{selected + 1} / {images.length}</span>}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
