"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, User, ShoppingBag, Menu, X, Heart, Phone } from "lucide-react";
import { useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { CartDrawer } from "./cart-drawer";
import { LocaleSwitcher } from "./locale-switcher";
import { useTranslations } from "@/hooks/use-translations";

const PHONE = "+37379966909";
const PHONE_DISPLAY = "079 966 909";

const NAV_LINK_KEYS = [
  { href: "/", key: "home" },
  { href: "/minipc", key: "minipc" },
  { href: "/laptopuri", key: "laptops" },
  { href: "/warranty", key: "warranty" },
  { href: "/contact", key: "contact" },
];

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || "ro";
  const tr = useTranslations();
  const { items } = useCart();
  const { items: favorites } = useFavorites();
  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/88 backdrop-blur-[18px] border-b border-[#e4e8e4]/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image src="/logo.svg" alt="Adamo" width={120} height={28} className="h-6 w-auto" priority />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINK_KEYS.map(({ href, key }) => {
              const localHref = href === "/" ? `/${locale}` : `/${locale}${href}`;
              const active = href === "/" ? pathname === `/${locale}` : pathname === localHref || pathname.startsWith(localHref + "/");
              return (
                <Link
                  key={href}
                  href={localHref}
                  className={`rounded-[7px] px-[14px] py-[9px] text-[14px] font-semibold transition-colors ${active ? "bg-[#edf7e8] text-[#1e4b17]" : "text-[#444545] hover:bg-[#f3f6f6] hover:text-[#1d1d1f]"}`}
                >
                  {tr.nav[key as keyof typeof tr.nav]}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            {/* Phone CTA — visible on md+ */}
            <a
              href={`tel:${PHONE}`}
              className="mr-2 hidden items-center gap-2.5 rounded-[9px] border border-[#e4e8e4] px-[13px] py-[8px] transition-colors hover:border-[#63ad36] md:flex"
            >
              <Phone className="h-5 w-5 text-[#63ad36]" />
              <span className="grid leading-[1.1]">
                <b className="text-[13px] font-bold text-[#1d1d1f]">{PHONE_DISPLAY}</b>
                <small className="text-[11px] text-[#6b6c6c]">{tr.header.callNow}</small>
              </span>
            </a>

            <button onClick={() => setSearchOpen(!searchOpen)} className="rounded-full p-2 text-[#1d1d1f] hover:bg-[#f3f6f6] transition-colors" aria-label="Căutare">
              <Search className="h-5 w-5" />
            </button>
            <button onClick={() => setCartOpen(true)} className="relative rounded-full p-2 text-[#1d1d1f] hover:bg-[#f3f6f6] transition-colors" aria-label="Coș">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#63ad36] text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <Link href="/favorites" className="relative rounded-full p-2 text-[#1d1d1f] hover:bg-[#f3f6f6] transition-colors">
              <Heart className="h-5 w-5" />
              {favorites.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#b64400] text-[10px] font-bold text-white">
                  {favorites.length}
                </span>
              )}
            </Link>
            <Link href="/account" className="hidden rounded-full p-2 text-[#1d1d1f] hover:bg-[#f3f6f6] transition-colors md:block">
              <User className="h-5 w-5" />
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-full p-2 text-[#1d1d1f] hover:bg-[#f3f6f6] transition-colors md:hidden" aria-label="Meniu">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-[#e4e8e4]/60 px-4 py-3">
            <form action={`/${locale}/search`} className="mx-auto max-w-7xl">
              <input
                name="q"
                type="text"
                placeholder={tr.header.search}
                className="w-full rounded-[9px] border border-[#e4e8e4] bg-white px-5 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#6b6c6c] focus:border-[#63ad36] focus:outline-none"
                autoFocus
              />
            </form>
          </div>
        )}
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)} />}
      <div className={`fixed right-0 top-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 md:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-[#e4e8e4]/60 px-5 py-4">
          <span className="text-base font-semibold text-[#1d1d1f]">{tr.nav.menu}</span>
          <button onClick={() => setMenuOpen(false)} className="rounded-full p-1.5 text-[#1d1d1f] hover:bg-[#f3f6f6] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-4 py-4">
          {NAV_LINK_KEYS.map(({ href, key }) => {
            const localHref = href === "/" ? `/${locale}` : `/${locale}${href}`;
            const active = href === "/" ? pathname === `/${locale}` : pathname === localHref || pathname.startsWith(localHref + "/");
            return (
              <Link
                key={href}
                href={localHref}
                onClick={() => setMenuOpen(false)}
                className={`rounded-[9px] px-4 py-3 text-sm font-semibold transition-colors ${active ? "bg-[#edf7e8] text-[#1e4b17]" : "text-[#444545] hover:bg-[#f3f6f6]"}`}
              >
                {tr.nav[key as keyof typeof tr.nav]}
              </Link>
            );
          })}
          <Link href={`/${locale}/favorites`} onClick={() => setMenuOpen(false)} className="rounded-[9px] px-4 py-3 text-sm font-semibold text-[#444545] hover:bg-[#f3f6f6] transition-colors">
            {tr.nav.favorites}
          </Link>
          <a href={`tel:${PHONE}`} className="mt-3 flex items-center gap-2 rounded-[9px] border border-[#e4e8e4] px-4 py-3 text-sm font-bold text-[#1d1d1f] transition-colors hover:border-[#63ad36]">
            <Phone className="h-4 w-4 text-[#63ad36]" /> {PHONE_DISPLAY}
          </a>
        </nav>
      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
