"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, removeItem, updateQty, total } = useCart();
  const tr = useTranslations();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [stockMsg, setStockMsg] = useState<number | null>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {open && <div ref={overlayRef} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#cccfcf]/50 px-5 py-4">
          <h2 className="text-lg font-semibold text-[#1d1d1f]">{tr.cart.title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-[#1d1d1f] hover:bg-[#f3f6f6] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
            <p className="text-[#6b6c6c]">{tr.cart.empty}</p>
            <button onClick={onClose} className="rounded-[28px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-2.5 text-sm font-medium text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all">
              {tr.cart.continueShopping}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.product_id}-${item.unit_id}`} className="flex gap-4 rounded-[28px] bg-[#f3f6f6] p-3">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[12px] bg-white">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-[#6b6c6c]">N/A</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <Link href={`/product/${item.product_id}`} onClick={onClose} className="text-sm font-medium text-[#1d1d1f] hover:text-[#4e8f28] transition-colors line-clamp-2">
                        {item.name}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="flex items-center rounded-[28px] border border-[#cccfcf]">
                          <button className="px-2 py-1 text-[#1d1d1f] hover:bg-white transition-colors rounded-l-[28px]" onClick={() => updateQty(item.product_id, item.unit_id, item.qty - 1)}>
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[24px] text-center text-sm font-medium text-[#1d1d1f]">{item.qty}</span>
                          <div className="relative">
                            <button
                              className="px-2 py-1 text-[#1d1d1f] hover:bg-white transition-colors rounded-r-[28px] disabled:opacity-30 disabled:pointer-events-none"
                              onClick={() => {
                                if (item.qty >= (item.stock || 99)) {
                                  setStockMsg(item.product_id);
                                  setTimeout(() => setStockMsg(null), 2000);
                                } else {
                                  updateQty(item.product_id, item.unit_id, item.qty + 1);
                                }
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            {stockMsg === item.product_id && (
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-[#1d1d1f] px-2.5 py-1 text-xs text-white shadow-lg">
                                {tr.cart.noStock}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#1d1d1f] ml-auto">{(item.price * item.qty).toFixed(0)} MDL</span>
                        <button onClick={() => removeItem(item.product_id, item.unit_id)} className="text-[#6b6c6c] hover:text-[#b64400] transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#cccfcf]/50 px-5 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#6b6c6c]">{tr.cart.subtotal}</span>
                <span className="font-semibold text-[#1d1d1f]">{total.toFixed(0)} MDL</span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-[28px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] py-3 text-sm font-medium text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all"
              >
                {tr.cart.checkout}
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
