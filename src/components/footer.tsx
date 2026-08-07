"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "@/hooks/use-translations";
import { CONTENT_PAGES } from "@/lib/content-pages";
import type { ContactSettings } from "@/lib/sanity";
import type { Locale } from "@/lib/translations";
import { ADAMO_COMPANY } from "@/lib/company";

const EMAIL = "adamocomputers@gmail.com";

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1BQVQd9MQZ/",
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 5h-1.6c-1.9 0-3 1.2-3 3.4v10.8"/><path d="M7.9 11.5h6.7"/><path d="M16.8 3.8h-3.4"/></svg>,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/adamo_md?igsh=MWtlZmdyYW0wN2N6bA==",
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.2" y="4.2" width="15.6" height="15.6" rx="4.6"/><path d="M15.7 12a3.7 3.7 0 1 1-7.4 0 3.7 3.7 0 0 1 7.4 0Z"/><path d="M17 7.2h.1"/></svg>,
  },
  {
    label: "TikTok",
    href: "https://vt.tiktok.com/ZSCM2pVjo/",
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.1 4.2v10.4a4.2 4.2 0 1 1-4.2-4.2"/><path d="M14.2 4.8c.7 2.8 2.5 4.4 5.4 4.7"/><path d="M9.9 14.7a1.7 1.7 0 1 0 1.7 1.7"/></svg>,
  },
];

export function Footer({ contact, publishedPageSlugs = [] }: { contact?: ContactSettings; publishedPageSlugs?: string[] }) {
  const params = useParams();
  const locale: Locale = params?.locale === "ru" || params?.locale === "en" ? params.locale : "ro";
  const l = (path: string) => `/${locale}${path}`;
  const tr = useTranslations();
  const email = contact?.email || EMAIL;
  const visible = (slug: string) => slug === "promotii" || publishedPageSlugs.includes(slug);
  const helpPages = CONTENT_PAGES.filter((page) => page.group === "help" && visible(page.slug));
  const companySlugs = ["cum-aleg-un-laptop", "blog", "centru-service", "termeni-si-conditii", "politica-de-confidentialitate", "despre-noi"];

  return (
    <footer
      className="grid grid-cols-1 gap-[34px] mx-auto border-t border-[#e1e7ef] px-[18px] py-[26px] md:grid-cols-2 md:px-[28px] md:py-[28px] lg:grid-cols-[1.2fr_1fr_1fr_1.1fr_1fr] lg:px-[28px] lg:py-[28px] pb-[82px] md:pb-4"
      style={{ maxWidth: "1240px" }}
    >
      {/* Brand */}
      <div>
        <span className="text-[30px] font-bold text-[#1d1d1f]">
          ADAMO<span className="text-[#63ad36]">.</span>MD
        </span>
        <small className="block text-[13px] text-[#6b6c6c] mt-0.5">{tr.footer.tagline}</small>
        <p className="mt-[18px] text-[14px] leading-[1.45] text-[#536070]">{tr.footer.description}</p>
        <div className="flex gap-[10px] mt-[18px]" aria-label={tr.footer.socialNetworksAria}>
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="grid place-items-center w-[34px] h-[34px] border border-[#e1e7ef] rounded-full bg-white text-[#5d6877] transition-[border-color,color,background,transform] duration-[.18s] hover:border-[#9fca86] hover:bg-[#f6fbf2] hover:text-[#34781f] hover:-translate-y-[1px]"
            >
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                {s.icon.props.children}
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div>
        <h3 className="mb-[14px] text-[14px] font-bold uppercase text-[#1d1d1f]">{tr.footer.shop}</h3>
        {helpPages.map((page) => (
          <Link key={page.slug} href={page.slug === "promotii" ? l("/category/laptops?sort=discount") : l(`/${page.slug}`)} className="block mb-[10px] text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">
            {page.title[locale]}
          </Link>
        ))}
      </div>

      {/* Info */}
      <div>
        <h3 className="mb-[14px] text-[14px] font-bold uppercase text-[#1d1d1f]">{tr.footer.info}</h3>
        {companySlugs.map((slug) => {
          if (slug === "blog") return <Link key={slug} href={l("/blog")} className="block mb-[10px] text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.footer.blog}</Link>;
          const page = CONTENT_PAGES.find((item) => item.slug === slug);
          if (!page || !visible(slug)) return null;
          return <Link key={slug} href={l(`/${slug}`)} className="block mb-[10px] text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{page.title[locale]}</Link>;
        })}
      </div>

      {/* Contacts */}
      <div>
        <h3 className="mb-[14px] text-[14px] font-bold uppercase text-[#1d1d1f]">{tr.footer.contacts}</h3>
        <p className="mb-[10px] text-[14px] leading-[1.45] text-[#536070]">
          <span className="whitespace-pre-line">{contact?.address || tr.footer.fallbackAddress}</span>
        </p>
        <a href={`tel:${ADAMO_COMPANY.phone}`} className="block mb-[10px] text-[14px] leading-[1.45] font-bold text-[#263142] hover:text-[#34781f] transition-colors">{ADAMO_COMPANY.phoneDisplay}</a>
        <a href={`mailto:${email}`} className="block mb-[10px] text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors break-all">{email}</a>
        <p className="mb-[10px] whitespace-pre-line text-[14px] leading-[1.45] text-[#536070]">{contact?.hours || tr.footer.fallbackHours}</p>
      </div>

      {/* Subscribe */}
      <div>
        <h3 className="mb-[14px] text-[14px] font-bold uppercase text-[#1d1d1f]">{tr.footer.subscribe}</h3>
        <p className="mb-[14px] text-[14px] leading-[1.45] text-[#536070]">{tr.footer.subscribeSub}</p>
        <form className="grid grid-cols-[1fr_54px] h-12 border border-[#e1e7ef] rounded-[7px] overflow-hidden">
          <input
            type="email"
            placeholder={tr.footer.emailPlaceholder}
            className="min-w-0 border-0 px-[14px] text-[14px] text-[#1d1d1f] placeholder:text-[#a0a8a0] outline-none bg-transparent"
          />
          <button
            type="submit"
            className="grid place-items-center border-0 text-white cursor-pointer"
            style={{ background: "linear-gradient(180deg, #78bb45, #55a02d)" }}
            aria-label={tr.footer.subscribe}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21 3-8.5 18-2.8-7.7L2 10.5 21 3Z"/>
              <path d="m9.7 13.3 5.1-5.1"/>
            </svg>
          </button>
        </form>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col gap-4 pt-[18px] border-t border-[#e1e7ef] items-center text-center lg:grid lg:gap-5 lg:items-center lg:text-left lg:justify-items-start" style={{ gridColumn: "1 / -1", gridTemplateColumns: "minmax(220px, 1fr) auto minmax(156px, 1fr)" }}>
        <small className="text-[12px] leading-[1.35] text-[#697586]">&copy; {new Date().getFullYear()} ADAMO.MD - {tr.footer.allRightsReserved}</small>
        <div className="flex items-center justify-center gap-3 text-[12px] font-semibold leading-[1.35] text-[#536070] whitespace-nowrap">
          <span>{tr.footer.rights}</span>
        </div>
        <div className="flex shrink-0 items-center justify-center gap-3 lg:justify-self-end" aria-label={tr.footer.paymentMethodsAria}>
          <img src="/payment-visa.svg" alt="Visa" className="h-7 w-auto" />
          <img src="/payment-mastercard.svg" alt="Mastercard" className="h-7 w-auto" />
        </div>
      </div>
    </footer>
  );
}
