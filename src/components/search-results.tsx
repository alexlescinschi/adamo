"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { PackageX } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const PER_PAGE = 24;

export function SearchResults({ query, products }: { query: string; products: any[] }) {
  const tr = useTranslations();
  const [visible, setVisible] = useState(PER_PAGE);
  const shown = products.slice(0, visible);
  const remaining = products.length - shown.length;

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-2">
        {query ? `${tr.search.resultsFor} "${query}"` : tr.search.resultsFor}
      </h1>

      {products.length > 0 && (
        <p className="text-sm text-slate-500 mb-6">
          {tr.search.resultsCount.replace("{count}", String(products.length))}
        </p>
      )}

      {products.length === 0 && query && (
        <div className="text-center py-12">
          <PackageX className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-500">
            {`${tr.search.noResults} „${query}". ${tr.search.noResultsSub}`}
          </p>
        </div>
      )}

      {products.length === 0 && !query && (
        <div className="text-center py-12 mt-6">
          <p className="text-slate-500">{tr.search.noResultsSub}</p>
        </div>
      )}

      {products.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {remaining > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setVisible((v) => v + PER_PAGE)}
                className="inline-flex items-center gap-2 rounded-[10px] border-2 border-[#63ad36] bg-white px-6 py-3 text-[14px] font-semibold text-[#34781f] transition-colors hover:bg-[#edf7e8]"
              >
                {tr.search.loadMore.replace("{count}", String(remaining))}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
