"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "@/hooks/use-translations";
import { useCart } from "@/hooks/use-cart";

export default function BpaySuccessPage() {
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "ro";
  const tr = useTranslations();
  const { clearCart } = useCart();
  useEffect(() => {
    localStorage.removeItem("adamo-checkout-operation");
    clearCart();
  }, [clearCart]);
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <CheckCircle className="mx-auto h-14 w-14 text-[#63ad36]" />
      <h1 className="mt-4 text-2xl font-bold text-[#1d1d1f]">{tr.checkout.bpaySuccessTitle}</h1>
      <p className="mt-3 text-[#536070]">{tr.checkout.bpaySuccessBody}</p>
      <Link href={`/${locale}`} className="mt-7 inline-block rounded-[12px] bg-[#63ad36] px-6 py-3 font-semibold text-white">{tr.checkout.continueShopping}</Link>
    </div>
  );
}
