"use client";

import Link from "next/link";
import { Search, User, ShoppingBag, Menu, X, Phone, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname, useParams } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { CartDrawer } from "./cart-drawer";
import { LocaleSwitcher } from "./locale-switcher";
import { useTranslations } from "@/hooks/use-translations";
import { formatPrice } from "@/lib/utils";
import type { CatalogCategory } from "@/lib/categories";

const PHONE = "+37379966909";
const PHONE_DISPLAY = "0 799 66 909";

const NAV_LINK_KEYS = [
  { href: "/", key: "home" },
  { href: "/warranty", key: "warranty" },
  { href: "/contact", key: "contact" },
];

export function Header({ categories = [], products = [] }: { categories?: CatalogCategory[]; products?: any[] }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const catalogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || "ro";
  const tr = useTranslations();
  const { items, cartOpenTrigger } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  const randomProducts = useMemo(() => {
    if (products.length <= 2) return products;
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  }, [catalogOpen, products]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) {
        setCatalogOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    try { localStorage.removeItem("adamo-favorites"); } catch {}
  }, []);

  // ponytail: open cart drawer when buyNow() is called from product page
  useEffect(() => {
    if (cartOpenTrigger > 0) setCartOpen(true);
  }, [cartOpenTrigger]);

  // ponytail: hide header on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (current > lastScrollY.current && current > 120) setHeaderHidden(true);
      else setHeaderHidden(false);
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const isCatalogActive = pathname.startsWith(`/${locale}/category/`);

  const desktopNavLinks = (
    <>
      {NAV_LINK_KEYS.map(({ href, key }) => {
        const isHome = href === "/";
        const isContact = href === "/contact";
        const localHref = isHome ? `/${locale}` : `/${locale}${href}`;
        const active = isHome ? pathname === `/${locale}` : pathname === localHref || pathname.startsWith(localHref + "/");
        return (
          <span key={href} className="contents">
            <Link
              href={localHref}
                    className={`rounded-[7px] px-[14px] py-[9px] text-[14px] font-semibold transition-colors ${active ? "bg-[#f3f6f6] text-[#1d1d1f]" : "text-[#444545] hover:bg-[#b5e79a] hover:text-[#1d1d1f]"}`}
            >
              {tr.nav[key as keyof typeof tr.nav]}
            </Link>
            {isHome && categories.length > 0 && (
              <div ref={catalogRef} className="relative">
                <button
                  type="button"
                  onClick={() => setCatalogOpen((v) => !v)}
                        className={`flex items-center gap-1 rounded-[7px] px-[14px] py-[9px] text-[14px] font-semibold transition-colors ${isCatalogActive || catalogOpen ? "bg-[#f3f6f6] text-[#1d1d1f]" : "text-[#444545] hover:bg-[#b5e79a] hover:text-[#1d1d1f]"}`}
                  aria-expanded={catalogOpen}
                >
                  {tr.nav.catalog}
                  <ChevronDown className={`h-4 w-4 transition-transform ${catalogOpen ? "rotate-180" : ""}`} />
                </button>
                {catalogOpen && (
                  <div className="fixed inset-x-0 top-16 z-50 rounded-b-[12px] border border-[#e4e8e4] bg-white shadow-[0_16px_40px_rgba(31,41,55,0.14)]">
                    <div className="mx-auto max-w-[1048px] px-4 py-6 grid grid-cols-3 gap-6">
                      <div className="flex flex-col gap-0.5 border-r border-[#e4e8e4]/60 pr-4">
                        {categories.map((c) => (
                          <Link
                            key={c.id}
                            href={`/${locale}/category/${c.slug}`}
                            onClick={() => setCatalogOpen(false)}
                            className="rounded-[7px] px-3 py-2.5 text-[14px] font-medium text-[#444545] hover:bg-[#b5e79a] hover:text-[#34781f] transition-colors"
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                      {randomProducts.length > 0 && (
                        randomProducts.map((p: any) => (
                            <Link
                              key={p.id}
                              href={`/${locale}/product/${p.slug ? `${p.id}-${p.slug}` : p.id}`}
                              onClick={() => setCatalogOpen(false)}
                              className="flex flex-col gap-3 rounded-[12px] border border-[#e4e8e4] p-4 hover:border-[#63ad36] hover:shadow-[0_8px_24px_rgba(99,173,54,0.1)] transition-all group"
                            >
                              {p.image_url && (
                                <div className="relative w-full aspect-[4/3] rounded-[8px] overflow-hidden bg-[#f3f6f6]">
                                  <img src={p.image_url} alt={p.name || ""} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                                </div>
                              )}
                              <div className="flex flex-col gap-1">
                                <span className="text-[14px] font-bold text-[#1d1d1f] leading-[1.25] line-clamp-2 group-hover:text-[#34781f] transition-colors">
                                  {p.name}
                                </span>
                                {p.price > 0 && (
                                  <span className="text-[16px] font-extrabold text-[#34781f]">{formatPrice(p.price)} lei</span>
                                )}
                              </div>
                            </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {isContact && <LocaleSwitcher />}
          </span>
        );
      })}
    </>
  );

  return (
    <>
      <header
        className={`sticky top-0 z-30 grid items-center gap-6 w-full bg-white/95 backdrop-blur-[18px] transition-transform duration-300 ${headerHidden ? "-translate-y-full" : "translate-y-0"}`}
        style={{
          gridTemplateColumns: "auto 1fr auto",
          padding: "11px max(24px, calc((100vw - 1048px) / 2))",
          boxShadow: "0 10px 28px rgba(31, 41, 55, .035)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="grid gap-0 font-extrabold tracking-[0] leading-none text-[29px] text-[#1d1d1f]">
          <span>ADAMO<span className="text-[#63ad36]">.</span>MD</span>
          <small className="mt-[5px] text-[10px] text-[#8a94a3] uppercase tracking-[1.8px] font-normal">Laptopuri premium</small>
        </Link>

        {/* Desktop nav — centered */}
        <nav className="hidden md:flex justify-center gap-[6px]">
          {desktopNavLinks}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          <a
            href={`tel:${PHONE}`}
            className="mr-1 hidden items-center gap-[10px] rounded-[9px] border border-[#e1e7ef] bg-white px-[13px] py-[8px] transition-colors hover:border-[#63ad36] sm:mr-2 md:flex"
          >
            <Phone className="h-5 w-5 text-[#63ad36]" style={{ animation: "vibrate 2s ease-in-out infinite" }} />
            <b className="text-[14px] font-bold text-[#1d1d1f]">{PHONE_DISPLAY}</b>
          </a>

          <button onClick={() => setSearchOpen(!searchOpen)} className="grid place-items-center w-[32px] h-[32px] bg-transparent cursor-pointer text-[#1d1d1f] hover:text-[#34781f] transition-colors sm:w-[42px] sm:h-[42px]" aria-label="Căutare">
            <Search className="h-[18px] w-[18px] sm:h-6 sm:w-6" />
          </button>
          <button onClick={() => setCartOpen(true)} className="relative grid place-items-center w-[32px] h-[32px] bg-transparent cursor-pointer text-[#1d1d1f] hover:text-[#34781f] transition-colors sm:w-[42px] sm:h-[42px]" aria-label="Coș">
            <ShoppingBag className="h-[18px] w-[18px] sm:h-6 sm:w-6" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[16px] h-[16px] grid place-items-center rounded-[20px] bg-[#63ad36] text-[10px] font-extrabold text-white sm:min-w-[18px] sm:h-[18px] sm:text-[11px] sm:top-[1px] sm:right-[3px]">
                {cartCount}
              </span>
            )}
          </button>
          <Link href={`/${locale}/account`} className="grid place-items-center w-[32px] h-[32px] bg-transparent cursor-pointer text-[#1d1d1f] hover:text-[#34781f] transition-colors sm:w-[42px] sm:h-[42px]">
            <User className="h-[18px] w-[18px] sm:h-6 sm:w-6" />
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="grid place-items-center w-[32px] h-[32px] bg-transparent cursor-pointer text-[#1d1d1f] hover:text-[#34781f] transition-colors sm:w-[42px] sm:h-[42px] md:hidden" aria-label="Meniu">
            {menuOpen ? <X className="h-[18px] w-[18px] sm:h-6 sm:w-6" /> : <Menu className="h-[18px] w-[18px] sm:h-6 sm:w-6" />}
          </button>
        </div>

        <div className={`absolute left-0 right-0 top-full z-40 overflow-hidden border-t border-[#e4e8e4]/60 bg-white/95 backdrop-blur-[18px] transition-all duration-300 ${searchOpen ? "max-h-16 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
          <div style={{ padding: "12px max(24px, calc((100vw - 1048px) / 2))" }}>
            <form action={`/${locale}/search`} onSubmit={() => setSearchOpen(false)}>
              <input
                ref={searchInputRef}
                name="q"
                type="text"
                placeholder={tr.header.search}
                className="w-full rounded-[9px] border border-[#e4e8e4] bg-white px-5 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#6b6c6c] focus:border-[#63ad36] focus:outline-none"
              />
            </form>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)} />}
      <div className={`fixed right-0 top-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 md:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-[#e4e8e4]/60 px-5 py-4">
          <span className="text-base font-semibold text-[#1d1d1f]">{tr.nav.menu}</span>
          <button onClick={() => setMenuOpen(false)} className="rounded-full p-1.5 text-[#1d1d1f] hover:bg-[#b5e79a] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-4 py-4">
          {NAV_LINK_KEYS.map(({ href, key }) => {
            const isHome = href === "/";
            const isContact = href === "/contact";
            const localHref = isHome ? `/${locale}` : `/${locale}${href}`;
            const active = isHome ? pathname === `/${locale}` : pathname === localHref || pathname.startsWith(localHref + "/");
            return (
              <span key={href} className="contents">
                <Link
                  href={localHref}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-[9px] px-4 py-3 text-sm font-semibold transition-colors ${active ? "bg-[#f3f6f6] text-[#1d1d1f]" : "text-[#444545] hover:bg-[#b5e79a]"}`}
                >
                  {tr.nav[key as keyof typeof tr.nav]}
                </Link>
                {isHome && categories.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setMobileCatalogOpen((v) => !v)}
                      className={`flex w-full items-center justify-between rounded-[9px] px-4 py-3 text-sm font-semibold transition-colors ${isCatalogActive || mobileCatalogOpen ? "bg-[#f3f6f6] text-[#1d1d1f]" : "text-[#444545] hover:bg-[#b5e79a]"}`}
                      aria-expanded={mobileCatalogOpen}
                    >
                      {tr.nav.catalog}
                      <ChevronDown className={`h-4 w-4 transition-transform ${mobileCatalogOpen ? "rotate-180" : ""}`} />
                    </button>
                    {mobileCatalogOpen && (
                      <div className="mt-1 ml-3 flex flex-col gap-0.5 border-l border-[#e4e8e4] pl-3">
                        {categories.map((c) => (
                          <Link
                            key={c.id}
                            href={`/${locale}/category/${c.slug}`}
                            onClick={() => { setMenuOpen(false); setMobileCatalogOpen(false); }}
                            className="rounded-[7px] px-3 py-2 text-[13px] font-medium text-[#444545] hover:bg-[#b5e79a] hover:text-[#34781f] transition-colors"
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {isContact && <LocaleSwitcher />}
              </span>
            );
          })}
          <a href={`tel:${PHONE}`} className="mt-3 flex items-center gap-2 rounded-[9px] border border-[#e4e8e4] px-4 py-3 text-sm font-bold text-[#1d1d1f] transition-colors hover:border-[#63ad36]">
            <Phone className="h-4 w-4 text-[#63ad36]" /> {PHONE_DISPLAY}
          </a>
        </nav>
      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
