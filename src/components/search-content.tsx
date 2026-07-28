"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { Loader2, PackageX } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export function SearchContent({ query: initialQuery }: { query: string }) {
  const params = useParams();
  const locale = (params?.locale as string) || "ro";
  const tr = useTranslations();
  const query = initialQuery;
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }
    fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}&limit=24`)
      .then((r) => r.json().catch(() => ({ items: [] })))
      .then((data) => {
        const items = data.items || data.products || data || [];
        setProducts(Array.isArray(items) ? items : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [query, locale]);

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-2">
        {query ? `${tr.search.resultsFor} "${query}"` : tr.header.search.replace("...", "")}
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
            {query ? `${tr.search.noResults} "${query}".` : tr.search.noResultsSub}
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
