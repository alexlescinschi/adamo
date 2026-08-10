"use client";

import { usePathname, useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const LOCALES = [
  { code: "ro", label: "Română" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

export function LocaleSwitcher() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || "ro";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function hrefFor(locale: string) {
    const segments = pathname.split("/");
    segments[1] = locale;
    const query = typeof window === "undefined" ? "" : window.location.search;
    const hash = typeof window === "undefined" ? "" : window.location.hash;
    return `${segments.join("/") || "/"}${query}${hash}`;
  }

  return (
    <div ref={ref} className="relative w-full md:w-auto">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-1 rounded-[9px] px-4 py-3 text-[14px] font-semibold text-[#444545] transition-colors hover:bg-[#f3f6f6] hover:text-[#1d1d1f] md:w-auto md:justify-start md:rounded-[7px] md:px-[14px] md:py-[9px]"
      >
        {currentLocale.toUpperCase()}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-1 w-full overflow-hidden rounded-[10px] border border-[#e4e8e4] bg-white py-1 md:absolute md:right-0 md:top-full md:z-50 md:min-w-[130px] md:w-auto md:shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
          {LOCALES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => {
                setOpen(false);
                document.cookie = `NEXT_LOCALE=${code}; Path=/; Max-Age=31536000; SameSite=Lax`;
                router.push(hrefFor(code));
              }}
              className={`flex w-full items-center gap-2 px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-[#f3f6f6] ${
                code === currentLocale ? "text-[#1e4b17] bg-[#edf7e8]" : "text-[#444545]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
