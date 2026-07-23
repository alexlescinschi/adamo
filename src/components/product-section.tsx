"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./product-card";
import { Loader2 } from "lucide-react";

interface ProductSectionProps {
  title: string;
  type: "popular" | "promotions" | "new";
  locale?: string;
}

export function ProductSection({ title, type, locale = "ro" }: ProductSectionProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products?type=${type}&locale=${encodeURIComponent(locale)}&limit=8`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
        else if (data && Array.isArray(data.items)) setProducts(data.items);
        else if (data && Array.isArray(data.products)) setProducts(data.products);
        else setProducts([]);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [type, locale]);

  if (loading) {
    return (
      <section className="py-[70px]">
        <h2 className="mb-6 text-xl font-semibold text-[#1d1d1f]">{title}</h2>
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6b6c6c]" />
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-[70px]">
      <h2 className="mb-6 text-xl font-semibold text-[#1d1d1f]">{title}</h2>
      <div className="grid grid-cols-2 gap-[14px] md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
