"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "./product-card";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryFilterProps {
  products: any[];
  categoryName: string;
  page: number;
  perPage: number;
}

export function CategoryFilter({ products, categoryName, page, perPage }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const goToPage = useCallback((p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    router.push(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }, [router, searchParams]);

  const specOptions = useMemo(() => {
    const options: Record<string, Set<string>> = {};
    for (const p of products) {
      if (p.specs) {
        for (const [label, value] of Object.entries(p.specs)) {
          if (!options[label]) options[label] = new Set();
          options[label].add(String(value));
        }
      }
    }
    return Object.entries(options).map(([label, values]) => ({
      label,
      values: Array.from(values).sort(),
    }));
  }, [products]);

  const filtered = useMemo(() => {
    const activeKeys = Object.keys(filters);
    if (activeKeys.length === 0) return products;
    return products.filter((p) =>
      activeKeys.every((key) => {
        const selected = filters[key];
        if (!selected.length) return true;
        const val = p.specs?.[key];
        return val && selected.includes(String(val));
      })
    );
  }, [products, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  // ponytail: citește pagina din URL (nu din prop-ul mort page). goToPage scrie ?page=N aici.
  const safePage = Math.min(Number(searchParams.get("page")) || 1, totalPages);
  const start = (safePage - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);

  const toggleFilter = (label: string, value: string) => {
    goToPage(1);
    setFilters((prev) => {
      const current = prev[label] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [label]: next.length ? next : [] };
    });
  };

  const clearFilters = () => {
    goToPage(1);
    setFilters({});
  };
  const hasFilters = Object.values(filters).some((v) => v.length > 0);

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

  if (products.length === 0) {
    return <p className="text-[#6b6c6c]">Nu sunt produse în această categorie.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f]">{categoryName}</h1>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-[#4e8f28] hover:underline">
              Resetează
            </button>
          )}
          {specOptions.length > 0 && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`rounded-[28px] border px-4 py-2 text-sm transition-colors md:hidden ${sidebarOpen ? "border-[#63ad36] bg-[#63ad36] text-white" : "border-[#cccfcf] text-[#1d1d1f]"}`}>
              Filtre
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {specOptions.length > 0 && (
          <>
            <div className={`flex-shrink-0 w-56 space-y-5 ${sidebarOpen ? "block" : "hidden"} md:block`}>
              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-[#4e8f28] hover:underline hidden md:block">
                  Resetează filtrele
                </button>
              )}
              {specOptions.map(({ label, values }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wide mb-2">{label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {values.map((value) => {
                      const active = filters[label]?.includes(value);
                      return (
                        <button
                          key={value}
                          onClick={() => toggleFilter(label, value)}
                          className={`rounded-[28px] px-3 py-1.5 text-xs transition-colors ${
                            active ? "bg-[#1d1d1f] text-white" : "bg-[#f3f6f6] text-[#444545] hover:bg-[#e8e8ed]"
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />}
            <div className={`fixed right-0 top-0 z-50 h-dvh w-72 max-w-[85vw] bg-white shadow-xl p-5 transition-transform duration-300 md:hidden ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
              <div className="flex items-center justify-between mb-6">
                <span className="text-base font-semibold text-[#1d1d1f]">Filtre</span>
                <button onClick={() => setSidebarOpen(false)} className="rounded-full p-1.5 text-[#1d1d1f] hover:bg-[#f3f6f6]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-5">
                {specOptions.map(({ label, values }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wide mb-2">{label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {values.map((value) => {
                        const active = filters[label]?.includes(value);
                        return (
                          <button
                            key={value}
                            onClick={() => toggleFilter(label, value)}
                            className={`rounded-[28px] px-3 py-1.5 text-xs transition-colors ${
                              active ? "bg-[#1d1d1f] text-white" : "bg-[#f3f6f6] text-[#444545] hover:bg-[#e8e8ed]"
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex-1">
          {filtered.length === 0 ? (
            <p className="text-[#6b6c6c] text-center py-12">
              Niciun produs nu corespunde filtrelor selectate.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-[14px] md:grid-cols-3">
                {paginated.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage <= 1}
                    className="rounded-full p-2 text-[#6b6c6c] transition-colors hover:bg-[#f3f6f6] disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {pageNumbers.map((p, i) =>
                    p === "..." ? (
                      <span key={`e-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-[#6b6c6c]">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                          p === safePage
                            ? "bg-[#1d1d1f] text-white"
                            : "text-[#6b6c6c] hover:bg-[#f3f6f6] hover:text-[#1d1d1f]"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage >= totalPages}
                    className="rounded-full p-2 text-[#6b6c6c] transition-colors hover:bg-[#f3f6f6] disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}

              <div className="mt-8 py-10 border-t border-[#cccfcf]/50">
                <h2 className="text-xl font-semibold text-[#1d1d1f] mb-3">Despre {categoryName}</h2>
                <p className="text-[#6b6c6c] leading-relaxed max-w-3xl">
                  {categoryName} de calitate la prețuri accesibile în magazinul Adamo. 
                  Oferim o gamă variată de produse de la branduri renumite, 
                  cu livrare rapidă în toată Moldova.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
