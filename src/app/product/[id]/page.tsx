"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { Loader2, ChevronLeft, ChevronRight, ShoppingCart, CheckCircle } from "lucide-react";

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}?locale=ro`)
      .then((r) => r.json().catch(() => null))
      .then((data) => setProduct(data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!product || product.error) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Produsul nu a fost găsit</h1>
        <p className="mt-2 text-slate-500">Produsul căutat nu există sau a fost eliminat.</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800">
          Înapoi la produse
        </Link>
      </div>
    );
  }

  const hasPrice = product.price > 0;
  const images = product.images?.length ? product.images : product.image_url ? [{ url: product.image_url }] : [];

  const handleAddToCart = () => {
    if (!hasPrice) return;
    addItem({
      product_id: product.id,
      unit_id: product.id,
      name: product.name,
      price: product.price,
      qty: 1,
      image: product.image_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6">
        <ChevronLeft className="h-4 w-4" />
        Înapoi la produse
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          {images.length > 0 ? (
            <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
              <Image
                src={images[selectedImage]?.url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow hover:bg-white">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={() => setSelectedImage((selectedImage + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow hover:bg-white">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">{selectedImage + 1} / {images.length}</span>
                </>
              )}
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-lg bg-slate-100 text-slate-400">Fără imagine</div>
          )}
          {images.length > 1 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto">
              {images.map((img: any, i: number) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border-2 ${i === selectedImage ? "border-slate-900" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <Image src={img.url} alt="" fill className="object-cover" sizes="48px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.availability === "OutOfStock" && (
            <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              Stoc epuizat
            </span>
          )}

          <div className="mt-4">
            {hasPrice ? (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-slate-900">{product.price.toFixed(2)} MDL</span>
                {product.old_price > 0 && (
                  <span className="text-lg text-slate-400 line-through">{product.old_price.toFixed(2)} MDL</span>
                )}
              </div>
            ) : (
              <span className="text-lg font-medium text-slate-600">Preț la cerere</span>
            )}
          </div>

          {product.description && (
            <p className="mt-4 text-slate-600 leading-relaxed">{product.description}</p>
          )}

          <button
            onClick={handleAddToCart}
            disabled={!hasPrice || product.availability === "OutOfStock"}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {added ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Adăugat în coș
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" />
                {hasPrice ? "Adaugă în coș" : "Indisponibil"}
              </>
            )}
          </button>
        </div>
      </div>

      {Object.keys(product.specs || {}).length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Specificații</h2>
          <div className="rounded-lg border border-slate-200 divide-y divide-slate-200">
            {Object.entries(product.specs).map(([key, value]) => (
              <div key={key} className="flex justify-between px-4 py-3">
                <span className="text-slate-600 capitalize">{key.replace(/_/g, " ")}</span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
