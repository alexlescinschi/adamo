"use client";

import Link from "next/link";
import { CircleX } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "@/hooks/use-translations";

export default function BpayFailPage() {
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "ro";
  const tr = useTranslations();
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <CircleX className="mx-auto h-14 w-14 text-[#b64400]" />
      <h1 className="mt-4 text-2xl font-bold text-[#1d1d1f]">{tr.checkout.bpayFailTitle}</h1>
      <p className="mt-3 text-[#536070]">{tr.checkout.bpayFailBody}</p>
      <Link href={`/${locale}/checkout`} className="mt-7 inline-block rounded-[12px] bg-[#63ad36] px-6 py-3 font-semibold text-white">{tr.checkout.backToCart}</Link>
    </div>
  );
}
