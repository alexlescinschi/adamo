"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/hooks/use-translations";

const CONSENT_COOKIE = "adamo_cookie_consent";
const CONSENT_MAX_AGE = 31536000;

const copy = {
  ro: { title: "Folosim cookie-uri", body: "Folosim cookie-uri necesare pentru funcționarea site-ului. Cookie-urile opționale vor fi activate doar cu acordul tău.", policy: "Politica de confidențialitate", necessary: "Doar necesare", all: "Acceptă toate" },
  ru: { title: "Мы используем cookie", body: "Мы используем необходимые cookie для работы сайта. Дополнительные cookie включаются только с вашего согласия.", policy: "Политика конфиденциальности", necessary: "Только необходимые", all: "Принять все" },
  en: { title: "We use cookies", body: "We use necessary cookies to operate the site. Optional cookies are enabled only with your consent.", policy: "Privacy policy", necessary: "Necessary only", all: "Accept all" },
} as const;

export function CookieConsent() {
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const text = copy[locale];

  useEffect(() => {
    if (!document.cookie.split("; ").some((cookie) => cookie.startsWith(`${CONSENT_COOKIE}=`))) setVisible(true);
  }, []);

  function choose(value: "necessary" | "all") {
    document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax; Secure`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section role="dialog" aria-label={text.title} className="fixed inset-x-3 bottom-3 z-[100] rounded-[14px] border border-[#d9e2d5] bg-white p-4 shadow-[0_12px_40px_rgba(31,41,55,0.18)] md:inset-x-auto md:right-5 md:max-w-[520px]">
      <h2 className="text-sm font-bold text-[#1d1d1f]">{text.title}</h2>
      <p className="mt-1.5 text-xs leading-5 text-[#526071]">{text.body}</p>
      <Link href={`/${locale}/politica-de-confidentialitate`} className="mt-1 inline-block text-xs font-semibold text-[#34781f] underline underline-offset-2">{text.policy}</Link>
      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => choose("necessary")} className="rounded-[9px] border border-[#63ad36] px-3 py-2 text-xs font-bold text-[#34781f] hover:bg-[#edf7e8] focus:outline-none focus:ring-2 focus:ring-[#63ad36]">{text.necessary}</button>
        <button type="button" onClick={() => choose("all")} className="rounded-[9px] bg-[#63ad36] px-3 py-2 text-xs font-bold text-white hover:bg-[#4e8f28] focus:outline-none focus:ring-2 focus:ring-[#34781f]">{text.all}</button>
      </div>
    </section>
  );
}
