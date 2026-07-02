"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  images?: string[];
  unit_id?: number;
  slug?: string;
  stock?: number;
  badge?: string;
  badge_type?: "green" | "blue";
  badge_gradient?: string;
  specs?: string[];
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const tr = useTranslations();
  const resolveUnit = useResolveUnit();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const hasPrice = product.price > 0;
  const isOutOfStock = product.stock !== undefined && product.stock === 0;
  const href = `/product/${product.slug ? `${product.id}-${product.slug}` : product.id}`;

  // ponytail: image slider — desktop auto-play on hover, mobile swipe
  const imgs = product.images && product.images.length > 0 ? product.images : (product.image_url ? [product.image_url] : []);
  const hasSlider = imgs.length > 1;
  const [imgIdx, setImgIdx] = useState(0);
  const [hovering, setHovering] = useState(false);
  const touchStart = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (hovering && hasSlider) {
      intervalRef.current = setInterval(() => {
        setImgIdx((i) => (i + 1) % imgs.length);
      }, 2000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [hovering, hasSlider, imgs.length]);

  const nextImg = useCallback(() => setImgIdx((i) => (i + 1) % imgs.length), [imgs.length]);
  const prevImg = useCallback(() => setImgIdx((i) => (i - 1 + imgs.length) % imgs.length), [imgs.length]);

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
    <article className={`group relative flex flex-col rounded-[9px] border border-[#e4e8e4] bg-white p-[14px] transition-all hover:-translate-y-[3px] hover:border-[#cfd9e6] hover:shadow-[0_18px_38px_rgba(31,41,55,0.10)] ${(!hasPrice || isOutOfStock) ? "opacity-60" : ""}`}>
      <Link
        href={href}
        className="relative mb-[10px] block aspect-[4/3] overflow-hidden rounded-[7px] bg-[#f3f6f6]"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); setImgIdx(0); }}
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStart.current - e.changedTouches[0].clientX;
          if (diff > 40) nextImg();
          else if (diff < -40) prevImg();
        }}
      >
        {product.badge && (
          <span className={`absolute top-2 left-2 z-10 rounded-[6px] px-2.5 py-1 text-[10px] font-black uppercase text-white shadow-[0_3px_10px_rgba(99,173,54,0.3)] bg-gradient-to-r ${product.badge_gradient || "from-[#7cc44e] to-[#63ad36]"}`}>
            {product.badge}
          </span>
        )}
        {imgs.length > 0 ? (
          <>
            {imgs.map((src, i) => (
              <Image
                key={i}
                src={src}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, 25vw"
                style={{ transform: `translateX(${(i - imgIdx) * 100}%)`, opacity: i === imgIdx ? 1 : 0 }}
              />
            ))}
            {hasSlider && (
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                {imgs.map((_, i) => (
                  <span
                    key={i}
                    className={`block w-[6px] h-[6px] rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </span>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#6b6c6c]">Fără imagine</div>
        )}
      </Link>

      <Link href={href} className="mb-[6px] text-[15px] font-extrabold leading-[1.2] text-[#1d1d1f] line-clamp-2 hover:text-[#34781f] transition-colors">
        {product.name}
      </Link>

      {product.specs && product.specs.length > 0 ? (() => {
        const s = product.specs;
        const lines = [
          `· ${s[0] || ""} ${s[1] || ""}`,
          `· ${s[2] || ""}`,
          `· ${s[3] || ""} / ${s[4] || ""} ${s[5] || ""}`,
          `· ${s[6] || ""}`,
        ].filter(l => l.length > 2);
        return (
          <p className="mb-[8px] text-[12px] leading-[1.42] text-[#526071] whitespace-pre-line">
            {lines.join("\n")}
          </p>
        );
      })() : (
        <div className="min-h-[10px]" />
      )}

      <div className="mt-auto pt-2">
        {hasPrice ? (
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <strong className="block text-[18px] font-extrabold leading-none text-[#34781f] whitespace-nowrap sm:text-[25px]">
                {formatPrice(product.price)} <small className="text-[10px] sm:text-[13px]">MDL</small>
              </strong>
              {product.old_price && product.old_price > product.price && (
                <span className="block text-[12px] text-[#6b6c6c] line-through whitespace-nowrap sm:text-sm">{formatPrice(product.old_price)} MDL</span>
              )}
              <p className="m-0 mt-[3px] text-[8.5px] font-medium text-[#1d1d1f] sm:text-[12.5px]">
                {tr.product.installments}
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
