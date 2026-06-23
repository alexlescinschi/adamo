"use client";

import { useCart } from "@/hooks/use-cart";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { CartCheckbox } from "@/components/cart-checkbox";

export function QuickOrder({ tr }: { tr: any }) {
  const cart = useCart();
  const params = useParams();
  const locale = (params?.locale as string) || "ro";

  if (cart.items.length === 0) {
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
        <div className="flex flex-col items-center justify-center gap-3 overflow-hidden border border-[#e1e7ef] rounded-[9px] bg-white/90 shadow-[0_18px_45px_rgba(31,41,55,0.08)] min-h-[120px] text-center">
          <ShoppingCart className="h-8 w-8 text-[#b8c4d2]" />
          <p className="text-[14px] text-[#6b6c6c]">{tr.home.quickOrderEmpty}</p>
        </div>
      </section>
    );
  }

  const checkedItems = cart.selectedItems;
  const total = cart.total;

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
        {cart.items.map((item) => {
          const checked = item.selected !== false;
          return (
            <div
              key={`${item.product_id}-${item.unit_id}`}
              className={`grid items-center gap-[14px] min-h-[86px] px-4 py-3 border-b border-[#e1e7ef] transition-[background,opacity] duration-[.18s] ${
                checked
                  ? "bg-[#f9fdf6]"
                  : "opacity-[0.62] bg-[#f8fafc]"
              }`}
              style={{ gridTemplateColumns: "18px 62px 1fr auto" }}
            >
              <CartCheckbox
                checked={checked}
                onChange={() => cart.toggleSelected(item.product_id, item.unit_id)}
                label={`Selecteaz\u0103 ${item.name}`}
              />

              <span className="w-[62px] h-[44px] flex-shrink-0 flex items-center justify-center bg-[#f3f6f6] rounded overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={62}
                    height={44}
                    className="w-full h-full object-contain"
                  />
                ) : null}
              </span>

              <span className="min-w-0 grid gap-[3px]">
                <b className="text-[15px] leading-[1.2] text-[#1d1d1f] truncate">
                  {item.name}
                </b>
                {item.qty > 1 && (
                  <small className="text-[12px] text-[#6b6c6c]">x{item.qty}</small>
                )}
              </span>

              <strong className="text-[24px] leading-none text-[#34781f] font-extrabold whitespace-nowrap">
                {fmt(item.price * item.qty)} <small className="text-[12px]">MDL</small>
              </strong>
            </div>
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

      {checkedItems.length > 0 ? (
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
