"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { PackageX } from "lucide-react";

const PER_PAGE = 24;

export function SearchResults({ query, products }: { query: string; products: any[] }) {
  const [visible, setVisible] = useState(PER_PAGE);
  const shown = products.slice(0, visible);
  const remaining = products.length - shown.length;

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">
        {query ? `Rezultate pentru "${query}"` : "Căutare"}
      </h1>

      {products.length === 0 && query && (
        <div className="text-center py-12">
          <PackageX className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-500">Nu am găsit produse pentru căutarea ta.</p>
        </div>
      )}

      {products.length === 0 && !query && (
        <div className="text-center py-12">
          <p className="text-slate-500">Introdu un termen de căutare.</p>
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
                Vezi mai multe ({remaining})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
