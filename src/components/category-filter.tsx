"use client";

import { useState, useMemo, useCallback, useEffect, type MouseEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "./product-card";
import { X, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "@/hooks/use-translations";

export interface FilterOption {
  value: string;
  label: string;
}
export interface FilterDefinition {
  code: string;
  label?: string;
  options: FilterOption[];
}
export interface CategoryLite {
  slug: string;
  name: string;
}

interface CategoryFilterProps {
  products: any[];
  categoryName: string;
  page: number;
  perPage: number;
  totalPages?: number;
  totalItems?: number;
  categorySlug: string;
  filterDefinitions: FilterDefinition[];
  categories: CategoryLite[];
  activeFilters: Record<string, string[]>;
  activePrice?: { min?: number; max?: number };
  serverPaginated?: boolean;
}

export function CategoryFilter({
  products,
  categoryName,
  page,
  perPage,
  totalPages: serverTotalPages,
  totalItems,
  categorySlug,
  filterDefinitions,
  categories,
  activeFilters,
  activePrice,
  serverPaginated,
}: CategoryFilterProps) {
  const tr = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [priceInput, setPriceInput] = useState({
    min: activePrice?.min?.toString() || "",
    max: activePrice?.max?.toString() || "",
  });

  // Paginile următoare se adaugă după produsele primite de la server.
  const [additionalProducts, setAdditionalProducts] = useState<any[]>([]);
  const [loadedPage, setLoadedPage] = useState(serverPaginated ? page : 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const catalogStateKey = `${categorySlug}?${searchParams.toString()}`;

  // Reset acumulare când se schimbă categoria, filtrele sau pagina inițială.
  useEffect(() => {
    setAdditionalProducts([]);
    setLoadedPage(serverPaginated ? page : 0);
    setLoadMoreError(false);
  }, [catalogStateKey, page, serverPaginated]);

  // Reconstruiește query-ul: suprascrie/scoate un filtru, păstrează restul, resetează page.
  const buildUrl = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || (Array.isArray(val) && val.length === 0)) p.delete(key);
        else p.set(key, Array.isArray(val) ? val.join(",") : String(val));
      }
      // orice toggle de filtru resetează pagina la 1
      p.delete("page");
      const qs = p.toString();
      return qs ? `?${qs}` : window.location.pathname;
    },
    [searchParams]
  );

  const applyUrl = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      router.push(buildUrl(updates), { scroll: false });
    },
    [router, buildUrl]
  );

  const toggleFilter = useCallback(
    (code: string, value: string) => {
      const current = activeFilters[code] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      applyUrl({ [`f_${code}`]: next.length ? next : null });
    },
    [activeFilters, applyUrl]
  );

  const applyPrice = useCallback(() => {
    const min = priceInput.min.trim();
    const max = priceInput.max.trim();
    applyUrl({
      price_min: min || null,
      price_max: max || null,
    });
  }, [priceInput, applyUrl]);

  const clearAll = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    for (const key of [...p.keys()]) p.delete(key);
    const qs = p.toString();
    router.push(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }, [router, searchParams]);

  // Fiecare pagină are URL propriu și păstrează filtrele active.
  const buildPageHref = useCallback(
    (n: number) => {
      const p = new URLSearchParams(searchParams.toString());
      if (n <= 1) p.delete("page");
      else p.set("page", String(n));
      const qs = p.toString();
      return `${pathname}${qs ? `?${qs}` : ""}`;
    },
    [pathname, searchParams]
  );

  const totalPages = serverPaginated
    ? Math.max(1, serverTotalPages || 1)
    : Math.max(1, Math.ceil(products.length / perPage));
  const safePage = Math.min(
    Number(searchParams.get("page")) || page || 1,
    totalPages
  );
  const visible = serverPaginated ? products : products.slice(0, perPage);

  const displayProducts = [...visible, ...additionalProducts];
  const canLoadMore = serverPaginated && loadedPage < totalPages;
  const nextPageItemCount = totalItems == null
    ? perPage
    : Math.min(perPage, Math.max(0, totalItems - loadedPage * perPage));
  const nextPageHref = buildPageHref(loadedPage + 1);

  const totalActive =
    Object.values(activeFilters).reduce((n, v) => n + v.length, 0) +
    (activePrice?.min != null ? 1 : 0) +
    (activePrice?.max != null ? 1 : 0);
  const loadMore = useCallback(async (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (loadingMore || !canLoadMore) return;

    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const nextPage = loadedPage + 1;
      const p = new URLSearchParams(searchParams.toString());
      p.set("page", String(nextPage));
      p.set("limit", String(perPage));
      p.set("locale", locale);
      const res = await fetch(`/api/category/${categorySlug}?${p.toString()}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.items) || data.items.length === 0) {
        throw new Error("Could not load the next catalog page");
      }

      setAdditionalProducts((previous) => {
        const seen = new Set([...visible, ...previous].map((product) => product.id));
        const unique = data.items.filter((product: any) => {
          if (seen.has(product.id)) return false;
          seen.add(product.id);
          return true;
        });
        return [...previous, ...unique];
      });
      setLoadedPage(nextPage);
    } catch {
      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [canLoadMore, categorySlug, loadedPage, loadingMore, locale, perPage, searchParams, visible]);

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  // Conținutul sidebar-ului (reutilizat desktop + drawer mobil).
  const SidebarContent = (
    <div className="space-y-6">
      {totalActive > 0 && (
        <button
          onClick={clearAll}
          className="text-sm text-[#4e8f28] hover:underline"
        >
          {tr.category.resetFilters.replace("{count}", String(totalActive))}
        </button>
      )}

      {/* Categorii */}
      {categories.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wide mb-2">
            {tr.category.categories}
          </p>
          <ul className="space-y-1.5">
            {categories.map((c) => {
              const isActive = c.slug === categorySlug;
              return (
                <li key={c.slug}>
                  <Link
                    href={`/${locale}/category/${c.slug}`}
                    className={`block text-sm transition-colors ${
                      isActive
                        ? "font-semibold text-[#1d1d1f]"
                        : "text-[#6b6c6c] hover:text-[#1d1d1f]"
                    }`}
                  >
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Preț */}
      <div>
        <p className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wide mb-2">
          {tr.category.price}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder={tr.category.min}
            value={priceInput.min}
            onChange={(e) => setPriceInput((s) => ({ ...s, min: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            className="w-full rounded-[8px] border border-[#cccfcf] px-2 py-1.5 text-sm focus:border-[#63ad36] focus:outline-none"
          />
          <span className="text-[#cccfcf]">–</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder={tr.category.max}
            value={priceInput.max}
            onChange={(e) => setPriceInput((s) => ({ ...s, max: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            className="w-full rounded-[8px] border border-[#cccfcf] px-2 py-1.5 text-sm focus:border-[#63ad36] focus:outline-none"
          />
        </div>
        <button
          onClick={applyPrice}
          className="mt-2 rounded-full bg-[#f3f6f6] px-3 py-1.5 text-xs text-[#444545] hover:bg-[#e8e8ed] transition-colors"
        >
          {tr.category.applyPrice}
        </button>
      </div>

      {/* Facetări (din filterDefinitions) */}
      {filterDefinitions.map((fd) => {
        const selected = activeFilters[fd.code] || [];
        if (!fd.options?.length) return null;
        return (
          <div key={fd.code}>
            <p className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wide mb-2">
              {fd.label || fd.code}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {fd.options.map((opt) => {
                const active = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleFilter(fd.code, opt.value)}
                    className={`rounded-[28px] px-3 py-1.5 text-xs transition-colors ${
                      active
                        ? "bg-[#1d1d1f] text-white"
                        : "bg-[#f3f6f6] text-[#444545] hover:bg-[#e8e8ed]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f]">
          {categoryName}
        </h1>
        <div className="flex items-center gap-3">
          {totalItems != null && (
            <span className="text-sm text-[#6b6c6c]">{tr.category.productCount.replace("{count}", String(totalItems))}</span>
          )}
          {(filterDefinitions.length > 0 || categories.length > 0) && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 rounded-[28px] border border-[#cccfcf] px-4 py-2 text-sm text-[#1d1d1f] transition-colors hover:bg-[#f3f6f6] md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {tr.category.filters}
              {totalActive > 0 && (
                <span className="ml-1 rounded-full bg-[#63ad36] px-1.5 text-[10px] font-bold text-white">
                  {totalActive}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar desktop */}
        {filterDefinitions.length > 0 || categories.length > 0 ? (
          <aside className="hidden w-56 flex-shrink-0 md:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
              {SidebarContent}
            </div>
          </aside>
        ) : null}

        {/* Drawer mobil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={`fixed right-0 top-0 z-50 h-dvh w-80 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-xl transition-transform duration-300 md:hidden ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            <span className="text-base font-semibold text-[#1d1d1f]">{tr.category.filters}</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-full p-1.5 text-[#1d1d1f] hover:bg-[#f3f6f6]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {SidebarContent}
          <button
            onClick={() => setSidebarOpen(false)}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-4 py-2.5 text-sm font-medium text-white"
          >
            {tr.category.viewProducts.replace("{count}", String(totalItems ?? ""))}
          </button>
        </div>

        {/* Grid produse */}
        <div className="flex-1">
          {visible.length === 0 ? (
            <p className="text-[#6b6c6c] py-12 text-center">
              {tr.category.noMatches}
            </p>
          ) : (
            <>
              <div data-testid="product-grid" className="grid grid-cols-2 gap-[14px] md:grid-cols-3">
                {displayProducts.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav aria-label={tr.category.pagination} className="mt-10 flex items-center justify-center gap-1.5">
                  {safePage <= 1 ? (
                    <span aria-disabled="true" className="rounded-full p-2 text-[#6b6c6c] opacity-30">
                      <ChevronLeft className="h-5 w-5" />
                    </span>
                  ) : (
                    <Link
                      href={buildPageHref(safePage - 1)}
                      scroll={false}
                      prefetch={false}
                      aria-label={tr.category.previousPage}
                      className="rounded-full p-2 text-[#6b6c6c] transition-colors hover:bg-[#f3f6f6]"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Link>
                  )}
                  {pageNumbers.map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`e-${i}`}
                        className="flex h-9 w-9 items-center justify-center text-sm text-[#6b6c6c]"
                      >
                        ...
                      </span>
                    ) : (
                      <Link
                        key={p}
                        href={buildPageHref(p)}
                        scroll={false}
                        prefetch={false}
                        aria-current={p === safePage ? "page" : undefined}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                          p === safePage
                            ? "bg-[#1d1d1f] text-white"
                            : "text-[#6b6c6c] hover:bg-[#f3f6f6] hover:text-[#1d1d1f]"
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}
                  {safePage >= totalPages ? (
                    <span aria-disabled="true" className="rounded-full p-2 text-[#6b6c6c] opacity-30">
                      <ChevronRight className="h-5 w-5" />
                    </span>
                  ) : (
                    <Link
                      href={buildPageHref(safePage + 1)}
                      scroll={false}
                      prefetch={false}
                      aria-label={tr.category.nextPage}
                      className="rounded-full p-2 text-[#6b6c6c] transition-colors hover:bg-[#f3f6f6]"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  )}
                </nav>
              )}

              {canLoadMore && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <Link
                    href={nextPageHref}
                    prefetch={false}
                    onClick={loadMore}
                    aria-disabled={loadingMore || undefined}
                    className={`rounded-[28px] border-2 border-[#63ad36] bg-white px-6 py-2.5 text-[14px] font-semibold text-[#34781f] transition-colors hover:bg-[#edf7e8] ${loadingMore ? "pointer-events-none opacity-50" : ""}`}
                  >
                    {loadingMore ? tr.common.loading : tr.category.loadMore.replace("{count}", String(nextPageItemCount))}
                  </Link>
                  {loadMoreError && (
                    <p role="alert" className="text-sm text-red-600">
                      {tr.category.loadMoreError}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-8 border-t border-[#cccfcf]/50 py-10">
                <h2 className="mb-3 text-xl font-semibold text-[#1d1d1f]">
                  {tr.category.about.replace("{name}", categoryName)}
                </h2>
                <p className="max-w-3xl leading-relaxed text-[#6b6c6c]">
                  {tr.category.aboutDescription.replace("{name}", categoryName)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
