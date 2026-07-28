"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "@/hooks/use-translations";

export default function NotFound() {
  const locale = useLocale();
  const tr = useTranslations();

  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-semibold text-[#1d1d1f]">{tr.errors.notFoundTitle}</h1>
      <p className="mt-3 text-[#6b6c6c]">{tr.errors.notFoundBody}</p>
      <Link
        href={`/${locale}`}
        className="mt-6 inline-block rounded-[12px] bg-[#63ad36] px-6 py-3 font-semibold text-white hover:bg-[#4e8f28]"
      >
        {tr.nav.home}
      </Link>
    </div>
  );
}
