"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`/api/categories/${slug}?locale=ro`).then((r) => r.json().catch(() => null)),
      fetch(`/api/categories/${slug}/products?locale=ro&limit=24`).then((r) => r.json().catch(() => [])),
    ])
      .then(([catData, prodData]) => {
        setCategory(catData);
        setProducts(Array.isArray(prodData) ? prodData : prodData?.items || []);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/" className="hover:text-slate-900">Acasă</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900">{category?.name || slug}</span>
      </div>
      <h1 className="text-2xl font-bold mb-6">{category?.name || slug}</h1>
      {products.length === 0 ? (
        <p className="text-slate-500">Nu sunt produse în această categorie.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
