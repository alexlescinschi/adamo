"use client";

import { useCart } from "@/hooks/use-cart";
import { CartCheckbox } from "@/components/cart-checkbox";
import { useParams } from "next/navigation";
import Link from "next/link";

interface QuickOrderProduct {
  id: number;
  unit_id: number;
  name: string;
  price: number;
}

export function QuickOrder({ products, tr }: { products: QuickOrderProduct[]; tr: any }) {
  const cart = useCart();
  const params = useParams();
  const locale = (params?.locale as string) || "ro";

  const isChecked = (productId: number) =>
    cart.items.some((i) => i.product_id === productId);

  const checkedProducts = products.filter((p) => isChecked(p.id));
  const total = checkedProducts.reduce((sum, p) => sum + p.price, 0);

  const toggle = (product: QuickOrderProduct) => {
    if (isChecked(product.id)) {
      cart.removeItem(product.id, product.unit_id);
    } else {
      cart.addItem({
        product_id: product.id,
        unit_id: product.unit_id,
        name: product.name,
        price: product.price,
        qty: 1,
        selected: true,
      });
    }
  };

  const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " MDL";

  return (
    <section className="py-[70px]">
      <div className="max-w-lg mx-auto bg-white border border-[#e4e8e4] rounded-[28px] p-6 md:p-8">
        <h2 className="text-[22px] font-extrabold text-[#1d1d1f] text-center mb-1">
          {tr.home.quickOrderTitle}
        </h2>
        <p className="text-[14px] text-[#6b6c6c] text-center mb-6">
          {tr.home.quickOrderSubtitle}
        </p>

        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-[12px] border transition-colors ${
                isChecked(p.id)
                  ? "bg-[#f0f9eb] border-[#63ad36]/20"
                  : "bg-white border-transparent hover:bg-[#f3f6f6]"
              }`}
            >
              <CartCheckbox
                checked={isChecked(p.id)}
                onChange={() => toggle(p)}
                label={`Selecteaz\u0103 ${p.name}`}
              />
              <span className="flex-1 text-[14px] font-semibold text-[#1d1d1f] truncate">
                {p.name}
              </span>
              <span className="text-[15px] font-extrabold text-[#1d1d1f] whitespace-nowrap">
                {fmt(p.price)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[#e4e8e4] space-y-2">
          <div className="flex justify-between text-[14px]">
            <span className="text-[#6b6c6c]">{tr.home.quickOrderTotal}</span>
            <span className="font-extrabold text-[#1d1d1f]">{fmt(total)}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-[#6b6c6c]">{tr.home.quickOrderDelivery}</span>
            <span className="font-extrabold text-[#63ad36]">0 MDL</span>
          </div>
        </div>

        {checkedProducts.length > 0 ? (
          <Link
            href={`/${locale}/checkout`}
            className="block mt-5 text-center text-[15px] font-bold py-3 px-6 rounded-[28px] bg-[#63ad36] text-white hover:bg-[#4e8f28] transition-colors"
          >
            {tr.home.quickOrderButton}
          </Link>
        ) : (
          <span className="block mt-5 text-center text-[15px] font-bold py-3 px-6 rounded-[28px] bg-[#e4e8e4] text-[#9ca3af] cursor-default">
            {tr.home.quickOrderButton}
          </span>
        )}
      </div>
    </section>
  );
}
