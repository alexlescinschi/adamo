"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { CartCheckoutContent } from "./cart-checkout";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const tr = useTranslations();
  const panelRef = useRef<HTMLDivElement>(null);

  // ponytail: lock body scroll + escape to close
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[#f8fafc] shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header fixat */}
        <div className="flex items-center justify-between border-b border-[#e4e8e4] bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-[#1d1d1f]">{tr.cart.title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-[#1d1d1f] hover:bg-[#f3f6f6] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scroll area cu tot checkout-ul */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <CartCheckoutContent onDone={onClose} />
        </div>
      </div>
    </>
  );
}
