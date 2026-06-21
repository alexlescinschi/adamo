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
      <div className="mx-auto max-w-7xl px-4 py-12">
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
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 md:flex-row">
          <span className="text-[12px] text-[#6b6c6c]">&copy; {new Date().getFullYear()} Adamo</span>
          <span className="text-[12px] text-[#6b6c6c] text-center">{tr.footer.rights}</span>
          <div aria-label="Visa · Mastercard" className="flex shrink-0 items-center justify-center gap-3 text-[#6b6c6c] sm:justify-end" role="group">
            <svg data-prefix="fab" data-icon="cc-visa" className="text-4xl" role="img" viewBox="0 0 576 512" aria-hidden="true" width="40" height="36">
              <path fill="currentColor" d="M470.1 231.3s7.6 37.2 9.3 45l-33.4 0c3.3-8.9 16-43.5 16-43.5-.2 .3 3.3-9.1 5.3-14.9l2.8 13.4zM576 80l0 352c0 26.5-21.5 48-48 48L48 480c-26.5 0-48-21.5-48-48L0 80C0 53.5 21.5 32 48 32l480 0c26.5 0 48 21.5 48 48zM152.5 331.2l63.2-155.2-42.5 0-39.3 106-4.3-21.5-14-71.4c-2.3-9.9-9.4-12.7-18.2-13.1l-64.7 0-.7 3.1c15.8 4 29.9 9.8 42.2 17.1l35.8 135 42.5 0zm94.4 .2l25.2-155.4-40.2 0-25.1 155.4 40.1 0zm139.9-50.8c.2-17.7-10.6-31.2-33.7-42.3-14.1-7.1-22.7-11.9-22.7-19.2 .2-6.6 7.3-13.4 23.1-13.4 13.1-.3 22.7 2.8 29.9 5.9l3.6 1.7 5.5-33.6c-7.9-3.1-20.5-6.6-36-6.6-39.7 0-67.6 21.2-67.8 51.4-.3 22.3 20 34.7 35.2 42.2 15.5 7.6 20.8 12.6 20.8 19.3-.2 10.4-12.6 15.2-24.1 15.2-16 0-24.6-2.5-37.7-8.3l-5.3-2.5-5.6 34.9c9.4 4.3 26.8 8.1 44.8 8.3 42.2 .1 69.7-20.8 70-53zM528 331.4l-32.4-155.4-31.1 0c-9.6 0-16.9 2.8-21 12.9l-59.7 142.5 42.2 0s6.9-19.2 8.4-23.3l51.6 0c1.2 5.5 4.8 23.3 4.8 23.3l37.2 0z" />
            </svg>
            <svg data-prefix="fab" data-icon="cc-mastercard" className="text-4xl" role="img" viewBox="0 0 576 512" aria-hidden="true" width="40" height="36">
              <path fill="currentColor" d="M482.9 410.3c0 6.8-4.6 11.7-11.2 11.7-6.8 0-11.2-5.2-11.2-11.7s4.4-11.7 11.2-11.7c6.6 0 11.2 5.2 11.2 11.7zM172.1 398.6c-7.1 0-11.2 5.2-11.2 11.7S165 422 172.1 422c6.5 0 10.9-4.9 10.9-11.7-.1-6.5-4.4-11.7-10.9-11.7zm117.5-.3c-5.4 0-8.7 3.5-9.5 8.7l19.1 0c-.9-5.7-4.4-8.7-9.6-8.7zm107.8 .3c-6.8 0-10.9 5.2-10.9 11.7s4.1 11.7 10.9 11.7 11.2-4.9 11.2-11.7c0-6.5-4.4-11.7-11.2-11.7zm105.9 26.1c0 .3 .3 .5 .3 1.1 0 .3-.3 .5-.3 1.1-.3 .3-.3 .5-.5 .8-.3 .3-.5 .5-1.1 .5-.3 .3-.5 .3-1.1 .3-.3 0-.5 0-1.1-.3-.3 0-.5-.3-.8-.5-.3-.3-.5-.5-.5-.8-.3-.5-.3-.8-.3-1.1 0-.5 0-.8 .3-1.1 0-.5 .3-.8 .5-1.1 .3-.3 .5-.3 .8-.5 .5-.3 .8-.3 1.1-.3 .5 0 .8 0 1.1 .3 .5 .3 .8 .3 1.1 .5s.2 .6 .5 1.1zm-2.2 1.4c.5 0 .5-.3 .8-.3 .3-.3 .3-.5 .3-.8s0-.5-.3-.8c-.3 0-.5-.3-1.1-.3l-1.6 0 0 3.5 .8 0 0-1.4 .3 0 1.1 1.4 .8 0-1.1-1.3zM576 81l0 352c0 26.5-21.5 48-48 48L48 481c-26.5 0-48-21.5-48-48L0 81C0 54.5 21.5 33 48 33l480 0c26.5 0 48 21.5 48 48zM64 220.6c0 76.5 62.1 138.5 138.5 138.5 27.2 0 53.9-8.2 76.5-23.1-72.9-59.3-72.4-171.2 0-230.5-22.6-15-49.3-23.1-76.5-23.1-76.4-.1-138.5 62-138.5 138.2zM288 329.4c70.5-55 70.2-162.2 0-217.5-70.2 55.3-70.5 162.6 0 217.5zM145.7 405.7c0-8.7-5.7-14.4-14.7-14.7-4.6 0-9.5 1.4-12.8 6.5-2.4-4.1-6.5-6.5-12.2-6.5-3.8 0-7.6 1.4-10.6 5.4l0-4.4-8.2 0 0 36.7 8.2 0c0-18.9-2.5-30.2 9-30.2 10.2 0 8.2 10.2 8.2 30.2l7.9 0c0-18.3-2.5-30.2 9-30.2 10.2 0 8.2 10 8.2 30.2l8.2 0 0-23-.2 0zM190.6 392l-7.9 0 0 4.4c-2.7-3.3-6.5-5.4-11.7-5.4-10.3 0-18.2 8.2-18.2 19.3 0 11.2 7.9 19.3 18.2 19.3 5.2 0 9-1.9 11.7-5.4l0 4.6 7.9 0 0-36.8zm40.5 25.6c0-15-22.9-8.2-22.9-15.2 0-5.7 11.9-4.8 18.5-1.1l3.3-6.5c-9.4-6.1-30.2-6-30.2 8.2 0 14.3 22.9 8.3 22.9 15 0 6.3-13.5 5.8-20.7 .8l-3.5 6.3c11.2 7.6 32.6 6 32.6-7.5zm35.4 9.3l-2.2-6.8c-3.8 2.1-12.2 4.4-12.2-4.1l0-16.6 13.1 0 0-7.4-13.1 0 0-11.2-8.2 0 0 11.2-7.6 0 0 7.3 7.6 0 0 16.7c0 17.6 17.3 14.4 22.6 10.9zm13.3-13.4l27.5 0c0-16.2-7.4-22.6-17.4-22.6-10.6 0-18.2 7.9-18.2 19.3 0 20.5 22.6 23.9 33.8 14.2l-3.8-6c-7.8 6.4-19.6 5.8-21.9-4.9zM338.9 392c-4.6-2-11.6-1.8-15.2 4.4l0-4.4-8.2 0 0 36.7 8.2 0 0-20.7c0-11.6 9.5-10.1 12.8-8.4l2.4-7.6zm10.6 18.3c0-11.4 11.6-15.1 20.7-8.4l3.8-6.5c-11.6-9.1-32.7-4.1-32.7 15 0 19.8 22.4 23.8 32.7 15l-3.8-6.5c-9.2 6.5-20.7 2.6-20.7-8.6zM416.2 392l-8.2 0 0 4.4c-8.3-11-29.9-4.8-29.9 13.9 0 19.2 22.4 24.7 29.9 13.9l0 4.6 8.2 0 0-36.8zm33.7 0c-2.4-1.2-11-2.9-15.2 4.4l0-4.4-7.9 0 0 36.7 7.9 0 0-20.7c0-11 9-10.3 12.8-8.4l2.4-7.6zm40.3-14.9l-7.9 0 0 19.3c-8.2-10.9-29.9-5.1-29.9 13.9 0 19.4 22.5 24.6 29.9 13.9l0 4.6 7.9 0 0-51.7zm7.6-75.1l0 4.6 .8 0 0-4.6 1.9 0 0-.8-4.6 0 0 .8 1.9 0zm6.6 123.8c0-.5 0-1.1-.3-1.6-.3-.3-.5-.8-.8-1.1s-.8-.5-1.1-.8c-.5 0-1.1-.3-1.6-.3-.3 0-.8 .3-1.4 .3-.5 .3-.8 .5-1.1 .8-.5 .3-.8 .8-.8 1.1-.3 .5-.3 1.1-.3 1.6 0 .3 0 .8 .3 1.4 0 .3 .3 .8 .8 1.1 .3 .3 .5 .5 1.1 .8 .5 .3 1.1 .3 1.4 .3 .5 0 1.1 0 1.6-.3 .3-.3 .8-.5 1.1-.8s.5-.8 .8-1.1c.3-.6 .3-1.1 .3-1.4zm3.2-124.7l-1.4 0-1.6 3.5-1.6-3.5-1.4 0 0 5.4 .8 0 0-4.1 1.6 3.5 1.1 0 1.4-3.5 0 4.1 1.1 0 0-5.4zm4.4-80.5c0-76.2-62.1-138.3-138.5-138.3-27.2 0-53.9 8.2-76.5 23.1 72.1 59.3 73.2 171.5 0 230.5 22.6 15 49.5 23.1 76.5 23.1 76.4 .1 138.5-61.9 138.5-138.4z" />
            </svg>
          </div>
        </div>
      </div>
    </footer>
  );
}
