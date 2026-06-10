"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";

const LOCALES = [
  { code: "ro", label: "RO" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

export function LocaleSwitcher() {
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = (params?.locale as string) || "ro";

  function hrefFor(locale: string) {
    // pathname is like /ro/product/123 — replace first segment
    const segments = pathname.split("/");
    segments[1] = locale;
    return segments.join("/") || "/";
  }

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map(({ code, label }) => (
        <Link
          key={code}
          href={hrefFor(code)}
          className={`px-2 py-1 text-[13px] font-semibold rounded transition-colors ${
            currentLocale === code
              ? "bg-[#edf7e8] text-[#1e4b17]"
              : "text-[#6b6c6c] hover:text-[#1d1d1f]"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
