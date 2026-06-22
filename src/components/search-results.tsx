"use client";

import { ProductCard } from "@/components/product-card";
import { PackageX } from "lucide-react";

export function SearchResults({ query, products }: { query: string; products: any[] }) {
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
