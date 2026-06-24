"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, MapPin, Mail, Clock } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "@/hooks/use-translations";

const PHONE = "+37379966909";
const PHONE_DISPLAY = "+373 799 669 09";
const EMAIL = "adamocomputers@gmail.com";

export function Footer() {
  const params = useParams();
  const locale = (params?.locale as string) || "ro";
  const l = (path: string) => `/${locale}${path}`;
  const tr = useTranslations();
  return (
    <footer className="mt-[70px] border-t border-[#e4e8e4] bg-[#f7f9f7]">
      <div className="mx-auto max-w-[1000px] px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href={l("/")} className="mb-4 flex items-center">
              <Image src="/logo.svg" alt="Adamo" width={120} height={28} className="h-6 w-auto" />
            </Link>
            <p className="mt-4 text-[14px] leading-[1.55] text-[#536070]">{tr.footer.description}</p>
            {/* Social icons */}
            <div className="mt-5 flex gap-[10px]">
              {[
                {
                  label: "Facebook",
                  href: "https://facebook.com/adamo.md",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  ),
                },
                {
                  label: "Instagram",
                  href: "https://instagram.com/adamo.md",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="url(#instaGradient)">
                      <defs>
                        <radialGradient id="instaGradient" cx="30%" cy="30%" r="100%">
                          <stop offset="0%" stopColor="#f09433" />
                          <stop offset="25%" stopColor="#e6683c" />
                          <stop offset="50%" stopColor="#dc2743" />
                          <stop offset="75%" stopColor="#cc2366" />
                          <stop offset="100%" stopColor="#bc1888" />
                        </radialGradient>
                      </defs>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                    </svg>
                  ),
                },
                {
                  label: "TikTok",
                  href: "https://tiktok.com/@adamo.md",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#000000">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  ),
                },
                {
                  label: "YouTube",
                  href: "https://youtube.com/@adamo.md",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#FF0000">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  ),
                },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white shadow-sm border border-[#e4e8e4] transition-transform hover:scale-110"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Menu */}
          <div>
            <h3 className="mb-[14px] text-[14px] font-bold uppercase tracking-wide text-[#1d1d1f]">{tr.footer.shop}</h3>
            <div className="flex flex-col gap-[10px]">
              <Link href={l("/minipc")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.nav.minipc}</Link>
              <Link href={l("/laptopuri")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.nav.laptops}</Link>
              <Link href={l("/warranty")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.nav.warranty}</Link>
              <Link href={l("/contact")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.nav.contact}</Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-[14px] text-[14px] font-bold uppercase tracking-wide text-[#1d1d1f]">{tr.footer.info}</h3>
            <div className="flex flex-col gap-[10px]">
              <Link href={l("/warranty")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.footer.delivery}</Link>
              <Link href={l("/warranty")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.nav.warranty}</Link>
              <Link href={l("/contact")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.footer.returns}</Link>
              <Link href={l("/politica-confidentzialinosti")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.footer.privacy}</Link>
              <Link href={l("/contact")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">{tr.footer.terms}</Link>
            </div>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="mb-[14px] text-[14px] font-bold uppercase tracking-wide text-[#1d1d1f]">{tr.footer.contacts}</h3>
            <div className="flex flex-col gap-[10px] text-[14px] leading-[1.45] text-[#536070]">
              <p>mun. Chișinău, Rîșcani<br />str. Dumitru Rîșcanu 11</p>
              <a href={`tel:${PHONE}`} className="font-bold text-[#263142] hover:text-[#34781f] transition-colors">{PHONE_DISPLAY}</a>
              <a href={`mailto:${EMAIL}`} className="hover:text-[#1d1d1f] transition-colors break-all">{EMAIL}</a>
              <p>Luni – Vineri: 09:00 – 18:00<br />Sâmbătă: 10:00 – 16:00</p>
            </div>
          </div>

          {/* Subscribe */}
          <div>
            <h3 className="mb-[14px] text-[14px] font-bold uppercase tracking-wide text-[#1d1d1f]">{tr.footer.subscribe}</h3>
            <p className="mb-4 text-[14px] leading-[1.45] text-[#536070]">{tr.footer.subscribeSub}</p>
            <form className="flex overflow-hidden rounded-[9px] border border-[#e4e8e4] bg-white focus-within:border-[#63ad36] transition-colors">
              <input
                type="email"
                placeholder={tr.footer.emailPlaceholder}
                className="min-w-0 flex-1 border-0 bg-transparent px-[14px] py-[10px] text-[14px] text-[#1d1d1f] placeholder:text-[#a0a8a0] outline-none"
              />
              <button
                type="submit"
                className="border-l border-[#e4e8e4] bg-[#63ad36] px-4 text-[13px] font-extrabold text-white transition-colors hover:bg-[#4e8f28]"
              >
                Go
              </button>
            </form>
          </div>

        </div>
      </div>

      <div className="border-t border-[#e4e8e4]">
        <div className="mx-auto flex max-w-[1000px] flex-col items-center justify-between gap-3 px-4 py-5 md:flex-row">
          <span className="text-[12px] text-[#6b6c6c]">&copy; {new Date().getFullYear()} Adamo</span>
          <span className="text-[12px] text-[#6b6c6c] text-center">{tr.footer.rights}</span>
          <div aria-label="Visa · Mastercard" className="flex shrink-0 items-center justify-center gap-3 sm:justify-end" role="group">
            <img src="/payment-visa.svg" alt="Visa" className="h-7 w-auto" />
            <img src="/payment-mastercard.svg" alt="Mastercard" className="h-7 w-auto" />
          </div>
        </div>
      </div>
    </footer>
  );
}
