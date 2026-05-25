"use client";

import Link from "next/link";
import { ShoppingCart, Search, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Adamo
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/category/telefoane" className="text-sm text-slate-600 hover:text-slate-900">
            Telefoane
          </Link>
          <Link href="/category/laptopuri" className="text-sm text-slate-600 hover:text-slate-900">
            Laptopuri
          </Link>
          <Link href="/category/accesorii" className="text-sm text-slate-600 hover:text-slate-900">
            Accesorii
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="rounded-full p-2 hover:bg-slate-100"
            aria-label="Căutare"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/cart"
            className="relative rounded-full p-2 hover:bg-slate-100"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <Link href="/account" className="rounded-full p-2 hover:bg-slate-100">
            <User className="h-5 w-5" />
          </Link>
          <button
            className="rounded-full p-2 hover:bg-slate-100 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Meniu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-slate-200 px-4 py-3">
          <form action="/search" className="mx-auto max-w-7xl">
            <input
              name="q"
              type="text"
              placeholder="Caută produse..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
              autoFocus
            />
          </form>
        </div>
      )}

      {menuOpen && (
        <div className="border-t border-slate-200 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link href="/category/telefoane" className="text-sm text-slate-600" onClick={() => setMenuOpen(false)}>
              Telefoane
            </Link>
            <Link href="/category/laptopuri" className="text-sm text-slate-600" onClick={() => setMenuOpen(false)}>
              Laptopuri
            </Link>
            <Link href="/category/accesorii" className="text-sm text-slate-600" onClick={() => setMenuOpen(false)}>
              Accesorii
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
