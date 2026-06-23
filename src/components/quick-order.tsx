"use client";

import { useCart } from "@/hooks/use-cart";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface QuickOrderProduct {
  id: number;
  unit_id: number;
  name: string;
  price: number;
  image_url: string | null;
  badge?: string;
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

  const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <section className="my-[28px] md:my-[30px]">
      <div className="flex items-end justify-between gap-4 mb-3">
        <h2 className="text-[22px] font-extrabold uppercase text-[#1d1d1f] leading-tight">
          {tr.home.quickOrderTitle}
        </h2>
        <span className="text-[14px] text-[#6b6c6c] whitespace-nowrap">
          {tr.home.quickOrderSubtitle}
        </span>
      </div>

      <div className="overflow-hidden border border-[#e1e7ef] rounded-[9px] bg-white/90 shadow-[0_18px_45px_rgba(31,41,55,0.08)]">
        {products.map((p) => {
          const checked = isChecked(p.id);
          return (
            <label
              key={p.id}
              className={`grid items-center gap-[14px] min-h-[86px] px-4 py-3 border-b border-[#e1e7ef] cursor-pointer transition-[background,opacity] duration-[.18s] ${
                checked
                  ? "bg-[#f9fdf6]"
                  : "opacity-[0.62] bg-[#f8fafc]"
              }`}
              style={{ gridTemplateColumns: "22px 62px 1fr auto" }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(p)}
                className="sr-only"
              />
              <span
                className={`grid place-items-center w-[22px] h-[22px] border rounded-[6px] bg-white flex-shrink-0 transition-[background,border-color] duration-[.18s] ${
                  checked
                    ? "border-[#63ad36] bg-[#63ad36]"
                    : "border-[#b8c4d2]"
                }`}
              >
                {checked && (
                  <span className="block w-[10px] h-[6px] border-l-2 border-b-2 border-white -rotate-45 translate-y-[-1px]" />
                )}
              </span>

              <span className="w-[62px] h-[44px] flex-shrink-0 flex items-center justify-center bg-[#f3f6f6] rounded overflow-hidden">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    width={62}
                    height={44}
                    className="w-full h-full object-contain"
                  />
                ) : null}
              </span>

              <span className="min-w-0 grid gap-[3px]">
                <b className="text-[15px] leading-[1.2] text-[#1d1d1f] truncate">
                  {p.name}
                </b>
                {p.badge && (
                  <small className="text-[12px] text-[#6b6c6c]">{p.badge}</small>
                )}
              </span>

              <strong className="text-[24px] leading-none text-[#34781f] font-extrabold whitespace-nowrap">
                {fmt(p.price)} <small className="text-[12px]">MDL</small>
              </strong>
            </label>
          );
        })}

        <div className="grid grid-cols-2 bg-[#fbfdf9]">
          <div className="flex items-center justify-between gap-[14px] min-h-[68px] px-[18px] py-[14px] border-r border-[#e1e7ef]">
            <span className="text-[12px] font-extrabold uppercase text-[#263142]">
              {tr.home.quickOrderTotal}
            </span>
            <strong className="text-[24px] leading-none text-[#34781f] font-extrabold">
              {fmt(total)} <small className="text-[12px]">MDL</small>
            </strong>
          </div>
          <div className="flex items-center justify-between gap-[14px] min-h-[68px] px-[18px] py-[14px]">
            <span className="text-[12px] font-extrabold uppercase text-[#263142]">
              {tr.home.quickOrderDelivery}
            </span>
            <strong className="text-[24px] leading-none text-[#34781f] font-extrabold">
              0 <small className="text-[12px]">MDL</small>
            </strong>
          </div>
        </div>
      </div>

      {/* ponytail: checkout CTA not in template, needed for flow */}
      {checkedProducts.length > 0 ? (
        <Link
          href={`/${locale}/checkout`}
          className="block mt-4 text-center text-[15px] font-bold py-3 px-6 rounded-[28px] bg-[#63ad36] text-white hover:bg-[#4e8f28] transition-colors"
        >
          {tr.home.quickOrderButton}
        </Link>
      ) : (
        <span className="block mt-4 text-center text-[15px] font-bold py-3 px-6 rounded-[28px] bg-[#e4e8e4] text-[#9ca3af] cursor-default">
          {tr.home.quickOrderButton}
        </span>
      )}
    </section>
  );
}
