"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./product-card";
import { Loader2 } from "lucide-react";

interface ProductSectionProps {
  title: string;
  type: "popular" | "promotions" | "new";
}

export function ProductSection({ title, type }: ProductSectionProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products?type=${type}&locale=ro&limit=8`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data && Array.isArray(data.items)) {
          setProducts(data.items);
        } else if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [type]);

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="mb-4 text-xl font-bold">{title}</h2>
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
