"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function CartPage() {
  const { items, removeItem, updateQty, total } = useCart();
  const tr = useTranslations();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 text-2xl font-bold">{tr.cart.empty}</h1>
        <p className="mt-2 text-slate-500">{tr.cart.emptySub}</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800">
          {tr.cart.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">{tr.cart.title}</h1>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={`${item.product_id}-${item.unit_id}`} className="flex gap-4 rounded-lg border border-slate-200 p-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">{tr.cart.noImage}</div>
                )}
              </div>
              <div className="flex-1">
                <Link href={`/product/${item.product_id}`} className="font-medium hover:underline">
                  {item.name}
                </Link>
                <p className="text-sm text-slate-500">
                  {item.price > 0 ? `${item.price.toFixed(0)} MDL` : tr.product.priceOnRequest}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center rounded-md border border-slate-300">
                  <button className="px-2 py-1 hover:bg-slate-100" onClick={() => updateQty(item.product_id, item.unit_id, item.qty - 1)}>
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium">{item.qty}</span>
                  <button className="px-2 py-1 hover:bg-slate-100" onClick={() => updateQty(item.product_id, item.unit_id, item.qty + 1)}>
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button onClick={() => removeItem(item.product_id, item.unit_id)} className="text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 p-6 h-fit">
          <h2 className="text-lg font-bold mb-4">{tr.cart.summary}</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">{tr.cart.subtotal}</span>
            <span className="font-medium">{total.toFixed(0)} MDL</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-slate-600">{tr.cart.delivery}</span>
            <span className="font-medium">{tr.cart.deliveryCalc}</span>
          </div>
          <div className="border-t border-slate-200 pt-4 flex justify-between text-lg font-bold">
            <span>{tr.cart.total}</span>
            <span>{total.toFixed(0)} MDL</span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 block w-full rounded-lg bg-slate-900 py-3 text-center text-white hover:bg-slate-800"
          >
            {tr.cart.continueToCheckout}
          </Link>
        </div>
      </div>
    </div>
  );
}
