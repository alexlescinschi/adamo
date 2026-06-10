"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, User, ShoppingBag, Menu, X, Heart } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { CartDrawer } from "./cart-drawer";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { items } = useCart();
  const { items: favorites } = useFavorites();
  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#f3f6f6]/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="Adamo" width={120} height={28} className="h-6 w-auto" priority />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/minipc" className="text-sm text-[#444545] hover:text-[#1d1d1f] transition-colors">
              Mini-PC
            </Link>
            <Link href="/laptopuri" className="text-sm text-[#444545] hover:text-[#1d1d1f] transition-colors">
              Laptopuri
            </Link>
            <Link href="/warranty" className="text-sm text-[#444545] hover:text-[#1d1d1f] transition-colors">
              Garanție
            </Link>
            <Link href="/contact" className="text-sm text-[#444545] hover:text-[#1d1d1f] transition-colors">
              Contacte
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(!searchOpen)} className="rounded-full p-2 text-[#1d1d1f] hover:bg-white/50 transition-colors" aria-label="Căutare">
              <Search className="h-5 w-5" />
            </button>
            <button onClick={() => setCartOpen(true)} className="relative rounded-full p-2 text-[#1d1d1f] hover:bg-white/50 transition-colors" aria-label="Coș">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0071e3] text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <Link href="/favorites" className="relative rounded-full p-2 text-[#1d1d1f] hover:bg-white/50 transition-colors">
              <Heart className="h-5 w-5" />
              {favorites.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#b64400] text-[10px] font-bold text-white">
                  {favorites.length}
                </span>
              )}
            </Link>
            <Link href="/account" className="rounded-full p-2 text-[#1d1d1f] hover:bg-white/50 transition-colors">
              <User className="h-5 w-5" />
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-full p-2 text-[#1d1d1f] hover:bg-white/50 transition-colors md:hidden" aria-label="Meniu">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-[#cccfcf]/50 px-4 py-3">
            <form action="/search" className="mx-auto max-w-7xl">
              <input
                name="q"
                type="text"
                placeholder="Caută produse..."
                className="w-full rounded-[28px] border border-[#cccfcf] bg-white px-5 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#6b6c6c] focus:border-[#0071e3] focus:outline-none"
                autoFocus
              />
            </form>
          </div>
        )}
      </header>
      {menuOpen && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)} />}
      <div className={`fixed right-0 top-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 md:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-[#cccfcf]/50 px-5 py-4">
          <span className="text-base font-semibold text-[#1d1d1f]">Meniu</span>
          <button onClick={() => setMenuOpen(false)} className="rounded-full p-1.5 text-[#1d1d1f] hover:bg-[#f3f6f6] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-4 py-4">
            <Link href="/minipc" onClick={() => setMenuOpen(false)} className="rounded-[12px] px-4 py-3 text-sm text-[#444545] hover:bg-[#f3f6f6] transition-colors">
              Mini-PC
            </Link>
            <Link href="/laptopuri" onClick={() => setMenuOpen(false)} className="rounded-[12px] px-4 py-3 text-sm text-[#444545] hover:bg-[#f3f6f6] transition-colors">
              Laptopuri
            </Link>
            <Link href="/warranty" onClick={() => setMenuOpen(false)} className="rounded-[12px] px-4 py-3 text-sm text-[#444545] hover:bg-[#f3f6f6] transition-colors">
              Garanție
            </Link>
            <Link href="/contact" onClick={() => setMenuOpen(false)} className="rounded-[12px] px-4 py-3 text-sm text-[#444545] hover:bg-[#f3f6f6] transition-colors">
              Contacte
            </Link>
            <Link href="/favorites" onClick={() => setMenuOpen(false)} className="rounded-[12px] px-4 py-3 text-sm text-[#444545] hover:bg-[#f3f6f6] transition-colors">
              Favorite
            </Link>
          </nav>
      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
