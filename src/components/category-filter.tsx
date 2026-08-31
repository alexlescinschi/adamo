"use client";

import { Fragment, useState, useCallback, useEffect, useRef, useTransition, type MouseEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "./product-card";
import { ArrowUpDown, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "@/hooks/use-translations";

export interface FilterOption {
  value: string;
  label: string;
  values?: string[];
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

interface CategoryBannerData {
  mediaUrl: string;
  linkUrl?: string | null;
  altText?: string | null;
}

const DISPLAY_RANGES = [
  { value: "under-12.9", label: '< 12.9"', matches: (size: number) => size < 12.9 },
  { value: "13.0-13.9", label: '13.0" - 13.9"', matches: (size: number) => size >= 13 && size <= 13.9 },
  { value: "14.0-14.9", label: '14.0" - 14.9"', matches: (size: number) => size >= 14 && size <= 14.9 },
  { value: "15.0-16.9", label: '15.0" - 16.9"', matches: (size: number) => size >= 15 && size <= 16.9 },
  { value: "over-17.0", label: '> 17.0"', matches: (size: number) => size > 17 },
];

function groupFilterDefinitions(definitions: FilterDefinition[]): FilterDefinition[] {
  return definitions.map((definition) => {
    if (definition.code !== "display") return definition;

    const grouped = DISPLAY_RANGES.map((range) => ({ ...range, values: [] as string[] }));
    const unmatched: FilterOption[] = [];
    for (const option of definition.options) {
      const size = Number.parseFloat(option.label.replace(",", "."));
      const range = Number.isNaN(size) ? undefined : grouped.find((candidate) => candidate.matches(size));
      if (range) range.values.push(option.value);
      else unmatched.push(option);
    }

    return {
      ...definition,
      options: [
        ...grouped.filter((range) => range.values.length > 0).map(({ value, label, values }) => ({ value, label, values })),
        ...unmatched,
      ],
    };
  });
}

function CategoryBanner({ banner, className, testId }: { banner: CategoryBannerData; className: string; testId: string }) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={banner.mediaUrl} alt={banner.altText || ""} loading="lazy" decoding="async" className="block h-auto w-full" />
  );

  return (
    <div data-testid={testId} className={`col-span-full overflow-hidden rounded-[9px] ${className}`}>
      {banner.linkUrl ? <a href={banner.linkUrl} className="block">{image}</a> : image}
    </div>
  );
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
  showAbout?: boolean;
  categoryBanner?: CategoryBannerData | null;
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
  showAbout = true,
  categoryBanner,
}: CategoryFilterProps) {
  const tr = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") || "newest";
  const [isPending, startTransition] = useTransition();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileControlsFloating, setMobileControlsFloating] = useState(false);
  const mobileControlsAnchorRef = useRef<HTMLDivElement>(null);
  const mobileScrollY = useRef(0);
  const [priceInput, setPriceInput] = useState({
    min: activePrice?.min?.toString() || "",
    max: activePrice?.max?.toString() || "",
  });
  // Păstrează selecția locală cât timp serverul încarcă următoarea combinație.
  const [optimisticFilters, setOptimisticFilters] = useState(activeFilters);
  const filtersRef = useRef(activeFilters);
  const paramsRef = useRef(searchParams.toString());
  const filterNavigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Paginile următoare se adaugă după produsele primite de la server.
  const [additionalProducts, setAdditionalProducts] = useState<any[]>([]);
  const [loadedPage, setLoadedPage] = useState(page);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const catalogParams = new URLSearchParams(searchParams.toString());
  catalogParams.delete("page");
  const catalogStateKey = `${categorySlug}?${catalogParams.toString()}`;

  // Reset acumulare când se schimbă categoria, filtrele sau pagina inițială.
  useEffect(() => {
    setAdditionalProducts([]);
    setLoadedPage(page);
    setLoadMoreError(false);
  }, [catalogStateKey, page, serverPaginated]);

  useEffect(() => {
    paramsRef.current = searchParams.toString();
    filtersRef.current = activeFilters;
    setOptimisticFilters(activeFilters);
  }, [activeFilters, searchParams]);

  useEffect(() => () => {
    if (filterNavigationTimer.current) clearTimeout(filterNavigationTimer.current);
  }, []);

  // Construiește URL-ul din ultima selecție locală, nu din URL-ul vechi primit
  // de la server cât timp o navigare precedentă este încă în curs.
  const buildUrl = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const p = new URLSearchParams(paramsRef.current);
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || (Array.isArray(val) && val.length === 0)) p.delete(key);
        else p.set(key, Array.isArray(val) ? val.join(",") : String(val));
      }
      // orice toggle de filtru resetează pagina la 1
      p.delete("page");
      const qs = p.toString();
      paramsRef.current = qs;
      return `${pathname}${qs ? `?${qs}` : ""}`;
    },
    [pathname]
  );

  const applyUrl = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      if (filterNavigationTimer.current) clearTimeout(filterNavigationTimer.current);
      startTransition(() => router.replace(buildUrl(updates), { scroll: false }));
    },
    [router, buildUrl, startTransition]
  );

  const toggleFilter = useCallback(
    (code: string, values: string[]) => {
      const current = filtersRef.current[code] || [];
      const active = values.every((value) => current.includes(value));
      const next = active
        ? current.filter((value) => !values.includes(value))
        : [...new Set([...current, ...values])];
      const updated = { ...filtersRef.current };
      if (next.length) updated[code] = next;
      else delete updated[code];
      filtersRef.current = updated;
      setOptimisticFilters(updated);

      const url = buildUrl({ [`f_${code}`]: next.length ? next : null });
      if (filterNavigationTimer.current) clearTimeout(filterNavigationTimer.current);
      filterNavigationTimer.current = setTimeout(() => {
        filterNavigationTimer.current = null;
        startTransition(() => router.replace(url, { scroll: false }));
      }, 180);
    },
    [buildUrl, router, startTransition]
  );

  useEffect(() => {
    setPriceInput({
      min: activePrice?.min?.toString() || "",
      max: activePrice?.max?.toString() || "",
    });
  }, [activePrice?.min, activePrice?.max]);

  useEffect(() => {
    const breakpoint = window.matchMedia("(max-width: 767px)");
    mobileScrollY.current = window.scrollY;

    const handleScroll = () => {
      if (!breakpoint.matches) {
        setMobileControlsFloating(false);
        return;
      }

      const current = window.scrollY;
      const delta = current - mobileScrollY.current;
      if (Math.abs(delta) < 4) return;

      const controlsPassed = (mobileControlsAnchorRef.current?.getBoundingClientRect().bottom ?? 0) < 0;
      setMobileControlsFloating(controlsPassed && delta < 0);
      mobileScrollY.current = current;
    };
    const handleBreakpoint = () => {
      if (!breakpoint.matches) setMobileControlsFloating(false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    breakpoint.addEventListener("change", handleBreakpoint);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      breakpoint.removeEventListener("change", handleBreakpoint);
    };
  }, []);

  useEffect(() => {
    if (sidebarOpen) setMobileControlsFloating(false);
  }, [sidebarOpen]);

  useEffect(() => {
    const min = priceInput.min.trim();
    const max = priceInput.max.trim();
    if (min === (activePrice?.min?.toString() || "") && max === (activePrice?.max?.toString() || "")) return;
    const timeout = setTimeout(() => applyUrl({ price_min: min || null, price_max: max || null }), 3500);
    return () => clearTimeout(timeout);
  }, [activePrice?.min, activePrice?.max, applyUrl, priceInput]);

  const clearAll = useCallback(() => {
    const p = new URLSearchParams(paramsRef.current);
    for (const key of [...p.keys()]) if (key !== "q" && key !== "type") p.delete(key);
    setPriceInput({ min: "", max: "" });
    filtersRef.current = {};
    setOptimisticFilters({});
    if (filterNavigationTimer.current) clearTimeout(filterNavigationTimer.current);
    const qs = p.toString();
    paramsRef.current = qs;
    startTransition(() => router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false }));
  }, [pathname, router, startTransition]);

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
  const visible = serverPaginated ? products : products.slice(0, loadedPage * perPage);

  const displayProducts = serverPaginated ? [...visible, ...additionalProducts] : visible;
  const canLoadMore = loadedPage < totalPages;
  const nextPageItemCount = totalItems == null
    ? perPage
    : Math.min(perPage, Math.max(0, totalItems - loadedPage * perPage));
  const nextPageHref = buildPageHref(loadedPage + 1);

  const visibleFilterDefinitions = filterDefinitions.filter((definition) => definition.code.toLowerCase() !== "sticker");
  const groupedFilterDefinitions = groupFilterDefinitions(visibleFilterDefinitions);
  const totalActive =
    Object.entries(optimisticFilters).reduce((count, [code, selected]) => {
      const definition = groupedFilterDefinitions.find((candidate) => candidate.code === code);
      if (!definition) return count + selected.length;
      const represented = new Set(definition.options.flatMap((option) => option.values || [option.value]));
      const selectedOptions = definition.options.filter((option) =>
        (option.values || [option.value]).some((value) => selected.includes(value))
      ).length;
      return count + selectedOptions + selected.filter((value) => !represented.has(value)).length;
    }, 0) +
    (activePrice?.min != null ? 1 : 0) +
    (activePrice?.max != null ? 1 : 0);
  const hasFilterControls = visibleFilterDefinitions.length > 0 || categories.length > 0;
  const loadMore = useCallback(async (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (loadingMore || !canLoadMore) return;

    const nextPage = loadedPage + 1;
    if (!serverPaginated) {
      setLoadedPage(nextPage);
      window.history.replaceState(window.history.state, "", buildPageHref(nextPage));
      return;
    }

    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const p = new URLSearchParams(paramsRef.current);
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
      window.history.replaceState(window.history.state, "", buildPageHref(nextPage));
    } catch {
      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [buildPageHref, canLoadMore, categorySlug, loadedPage, loadingMore, locale, perPage, serverPaginated, visible]);

  // Conținutul sidebar-ului (reutilizat desktop + drawer mobil).
  const SidebarContent = (
    <div className="space-y-6">
      <button
        onClick={clearAll}
        className="text-sm text-[#4e8f28] hover:underline"
      >
        {tr.category.resetFilters}
      </button>

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
                    data-testid="category-filter-link"
                    className={`inline-block rounded-[28px] px-3 py-1.5 text-xs transition-colors ${
                      isActive
                        ? "bg-[#1d1d1f] text-white"
                        : "bg-[#f3f6f6] text-[#444545] hover:bg-[#e8e8ed]"
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
            className="w-full rounded-[8px] border border-[#cccfcf] px-2 py-1.5 text-sm focus:border-[#63ad36] focus:outline-none"
          />
          <span className="text-[#cccfcf]">–</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder={tr.category.max}
            value={priceInput.max}
            onChange={(e) => setPriceInput((s) => ({ ...s, max: e.target.value }))}
            className="w-full rounded-[8px] border border-[#cccfcf] px-2 py-1.5 text-sm focus:border-[#63ad36] focus:outline-none"
          />
        </div>
      </div>

      {/* Facetări (din filterDefinitions) */}
      {groupedFilterDefinitions.map((fd) => {
        const selected = optimisticFilters[fd.code] || [];
        if (!fd.options?.length) return null;
        return (
          <div key={fd.code}>
            <p className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wide mb-2">
              {fd.label || fd.code}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {fd.options.map((opt) => {
                const values = opt.values || [opt.value];
                const active = values.every((value) => selected.includes(value));
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleFilter(fd.code, values)}
                    aria-pressed={active}
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
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
        <h1 className="text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f]">
          {categoryName}
        </h1>
        <div ref={mobileControlsAnchorRef} className="h-10 min-w-0 w-full md:h-auto md:w-auto">
          <div
            data-testid="mobile-catalog-controls"
            data-floating={mobileControlsFloating && !sidebarOpen ? "true" : "false"}
            data-active-filters={totalActive}
            className={`flex max-w-full gap-2 overflow-x-auto overflow-y-hidden transition-[filter,transform,opacity] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:static md:max-w-none md:flex-col md:items-end md:overflow-visible md:drop-shadow-none ${
              mobileControlsFloating && !sidebarOpen
                ? "fixed left-3 right-3 top-[72px] z-20 drop-shadow-[0_8px_18px_rgba(31,41,55,0.18)] animate-in fade-in slide-in-from-top-2"
                : "relative w-full md:w-auto"
            }`}
          >
            {totalItems != null && (
              <span className="hidden text-sm text-[#6b6c6c] md:block">{tr.category.productCount.replace("{count}", String(totalItems))}</span>
            )}
            {hasFilterControls && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-max flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[28px] border border-[#ccd5df] bg-white px-3 text-sm font-semibold text-[#1d1d1f] transition-colors hover:border-[#63ad36] hover:bg-[#f6fbf2] md:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 flex-shrink-0" />
                <span>{tr.category.filters}</span>
                {totalActive > 0 && (
                  <span className="ml-0.5 rounded-full bg-[#63ad36] px-1.5 text-[10px] font-bold text-white">
                    {totalActive}
                  </span>
                )}
              </button>
            )}
            <div className="relative ml-auto h-10 w-max flex-none rounded-[28px] border border-[#ccd5df] bg-white transition-colors focus-within:border-[#63ad36] md:ml-0 md:border-[#cccfcf]">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#526071] md:hidden" />
              <select
                aria-label={tr.category.sortLabel}
                value={sort}
                onChange={(event) => applyUrl({ sort: event.target.value })}
                className="h-full w-auto min-w-max appearance-none whitespace-nowrap rounded-[28px] bg-transparent pl-9 pr-8 text-sm font-semibold text-[#1d1d1f] focus:outline-none md:appearance-auto md:px-4 md:py-2 md:font-normal"
              >
                <option value="newest">{tr.category.sortNewest}</option>
                <option value="price_asc">{tr.category.sortPriceAsc}</option>
                <option value="price_desc">{tr.category.sortPriceDesc}</option>
                <option value="popular">{tr.category.sortPopular}</option>
                <option value="discount">{tr.category.sortDiscount}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#526071] md:hidden" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar desktop */}
        {hasFilterControls ? (
          <aside className="hidden w-56 flex-shrink-0 md:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
              {SidebarContent}
            </div>
          </aside>
        ) : null}

        {/* Drawer mobil */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={tr.category.filters}
          aria-hidden={!sidebarOpen}
          className={`fixed inset-0 z-50 flex h-dvh w-full flex-col bg-white transition-transform duration-300 md:hidden ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#e4e8e4] p-5">
            <span className="text-base font-semibold text-[#1d1d1f]">{tr.category.filters}</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-full p-1.5 text-[#1d1d1f] hover:bg-[#f3f6f6]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{SidebarContent}</div>
          <div className="border-t border-[#e4e8e4] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-full rounded-full bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-4 py-3 text-sm font-medium text-white"
            >
              {tr.category.viewProducts.replace("{count}", String(totalItems ?? ""))}
            </button>
          </div>
        </div>

        {/* Grid produse */}
        <div className="flex-1">
          {visible.length === 0 ? (
            <p className="text-[#6b6c6c] py-12 text-center">
              {tr.category.noMatches}
            </p>
          ) : (
            <>
              <div data-testid="product-grid" aria-busy={isPending || undefined} className="grid grid-cols-2 gap-[14px] md:grid-cols-3">
                {displayProducts.map((p: any, index: number) => (
                  <Fragment key={p.id}>
                    <ProductCard product={p} />
                    {categoryBanner && index === 7 && (
                      <CategoryBanner banner={categoryBanner} testId="category-banner-mobile" className="md:hidden" />
                    )}
                    {categoryBanner && index === 11 && (
                      <CategoryBanner banner={categoryBanner} testId="category-banner-desktop" className="hidden md:block" />
                    )}
                  </Fragment>
                ))}
              </div>

              {canLoadMore && (
                <div className="mt-10 flex flex-col items-center gap-2">
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

              {showAbout && (
                <div className="mt-8 border-t border-[#cccfcf]/50 py-10">
                  <h2 className="mb-3 text-xl font-semibold text-[#1d1d1f]">
                    {tr.category.about.replace("{name}", categoryName)}
                  </h2>
                  <p className="max-w-3xl leading-relaxed text-[#6b6c6c]">
                    {tr.category.aboutDescription.replace("{name}", categoryName)}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
