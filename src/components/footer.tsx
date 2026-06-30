"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "@/hooks/use-translations";

const PHONE = "+37379966909";
const PHONE_DISPLAY = "0 799 66 909";
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

export function Footer() {
  const params = useParams();
  const locale = (params?.locale as string) || "ro";
  const l = (path: string) => `/${locale}${path}`;
  const tr = useTranslations();

  return (
    <footer
      className="grid grid-cols-1 gap-[34px] mx-auto border-t border-[#e1e7ef] px-[18px] py-[26px] md:grid-cols-2 md:px-[28px] md:py-[28px] lg:grid-cols-[1.3fr_0.7fr_0.9fr_1.2fr_1fr] lg:px-[28px] lg:py-[28px] pb-[82px] md:pb-4"
      style={{ maxWidth: "1240px" }}
    >
      {/* Brand */}
      <div>
        <span className="text-[30px] font-bold text-[#1d1d1f]">
          ADAMO<span className="text-[#63ad36]">.</span>MD
        </span>
        <small className="block text-[13px] text-[#6b6c6c] mt-0.5">Laptopuri premium</small>
        <p className="mt-[18px] text-[14px] leading-[1.45] text-[#536070]">{tr.footer.description}</p>
        <div className="flex gap-[10px] mt-[18px]" aria-label="Rețele sociale ADAMO.MD">
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
        <Link href={l("/laptopuri")} className="block mb-[10px] text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.nav.laptops}</Link>
        <Link href={l("/laptopuri")} className="block mb-[10px] text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">Gaming</Link>
        <Link href={l("/warranty")} className="block mb-[10px] text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.nav.warranty}</Link>
        <Link href={l("/contact")} className="block mb-[10px] text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.nav.contact}</Link>
      </div>

      {/* Info */}
      <div>
        <h3 className="mb-[14px] text-[14px] font-bold uppercase text-[#1d1d1f]">{tr.footer.info}</h3>
        <Link href={l("/warranty")} className="block mb-[10px] text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">Modalități de plată</Link>
        <Link href={l("/contact")} className="block mb-[10px] text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.footer.returns}</Link>
        <Link href={l("/contact")} className="block mb-[10px] text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.footer.terms}</Link>
        <Link href={l("/politica-confidentzialinosti")} className="block mb-[10px] text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.footer.privacy}</Link>
      </div>

      {/* Contacts */}
      <div>
        <h3 className="mb-[14px] text-[14px] font-bold uppercase text-[#1d1d1f]">{tr.footer.contacts}</h3>
        <p className="mb-[10px] text-[14px] leading-[1.45] text-[#536070]">
          mun. Chișinău, Rîșcani<br />str. Dumitru Rîșcanu 11<br />intrarea lângă scara 5
        </p>
        <div className="overflow-hidden rounded-[7px] border border-[#e1e7ef] w-[120px] h-[80px] mt-[10px] mb-[10px]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2720!2d28.8643582!3d47.0367942!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40c97ddfed7eb7a9%3A0x6c229442d3cdc54f!2sAdamo!5e0!3m2!1sro!2s!4v1"
            width="120" height="80"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Adamo"
          />
        </div>
        <a href={`tel:${PHONE}`} className="block mb-[10px] text-[14px] leading-[1.45] font-bold text-[#263142] hover:text-[#34781f] transition-colors">{PHONE_DISPLAY}</a>
        <a href={`mailto:${EMAIL}`} className="block mb-[10px] text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors break-all">{EMAIL}</a>
        <p className="mb-[10px] text-[14px] leading-[1.45] text-[#536070]">Luni - Vineri: 09:00 - 18:00<br />Sâmbătă: 10:00 - 16:00</p>
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
        <small className="text-[12px] leading-[1.35] text-[#697586]">&copy; {new Date().getFullYear()} ADAMO.MD - Toate drepturile rezervate.</small>
        <div className="flex items-center justify-center gap-3 text-[12px] font-semibold leading-[1.35] text-[#536070] whitespace-nowrap">
          <span>Creat cu <span className="text-red-500 text-[15px]">♥</span> în Moldova</span>
          <span>Design by GPT</span>
        </div>
        <div className="flex shrink-0 items-center justify-center gap-3 lg:justify-self-end" aria-label="Metode de plată">
          <img src="/payment-visa.svg" alt="Visa" className="h-7 w-auto" />
          <img src="/payment-mastercard.svg" alt="Mastercard" className="h-7 w-auto" />
        </div>
      </div>
    </footer>
  );
}
