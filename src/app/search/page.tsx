"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { Loader2, PackageX } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }
    fetch(`/api/search?q=${encodeURIComponent(query)}&locale=ro&limit=24`)
      .then((r) => r.json().catch(() => ({ items: [] })))
      .then((data) => {
        const items = data.items || data.products || data || [];
        setProducts(Array.isArray(items) ? items : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-2">
        {query ? `Rezultate pentru "${query}"` : "Căutare"}
      </h1>

      {loading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <PackageX className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-500">
            {query ? "Nu am găsit produse pentru căutarea ta." : "Introdu un termen de căutare."}
          </p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
