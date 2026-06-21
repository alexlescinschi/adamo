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
            {/* Social circles */}
            <div className="mt-5 flex gap-[10px]">
              {[
                { label: "Facebook", href: "https://facebook.com/adamo.md", abbr: "f" },
                { label: "Instagram", href: "https://instagram.com/adamo.md", abbr: "ig" },
                { label: "TikTok", href: "https://tiktok.com/@adamo.md", abbr: "tt" },
                { label: "YouTube", href: "https://youtube.com/@adamo.md", abbr: "yt" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#e4e8e4] text-[12px] font-bold text-[#536070] transition-colors hover:border-[#63ad36] hover:text-[#34781f]"
                >
                  {s.abbr}
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
              <path fill="currentColor" d="M482.9 410.3c0 6.8-4.6 11.7-11.2 11.7-6.8 0-11.2-5.2-11.2-11.7s4.4-11.7 11.2-11.7c6.6 0 11.2 5.2 11.2 11.7zM172.1 398.6c-7.1 0-11.2 5.2-11.2 11.7S165 422 172.1 422c6.5 0 10.9-4.9 10.9-11.7-.1-6.5-4.4-11.7-10.9-11.7zm117.5-.3c-5.4 0-8.7 3.5-9.5 8.7l19.1 0c-.9-5.7-4.4-8.7-9.6-8.7zm107.8 .3c-6.8 0-10.9 5.2-10.9 11.7s4.1 11.7 10.9 11.7 11.2-4.9 11.2-11.7c0-6.5-4.4-11.7-11.2-11.7zm105.9 26.1c0 .3 .3 .5 .3 1.1 0 .3-.3 .5-.3 1.1-.3 .3-.3 .5-.5 .8-.3 .3-.5 .5-1.1 .5-.3 .3-.5 .3-1.1 .3-.3 0-.5 0-1.1-.3-.3 0-.5-.3-.8-.5-.3-.3-.5-.5-.5-.8-.3-.5-.3-.8-.3-1.1 0-.5 0-.8 .3-1.1 0-.5 .3-.8 .5-1.1 .3-.3 .5-.3 .8-.5 .5-.3 .8-.3 1.1-.3 .5 0 .8 0 1.1 .3 .5 .3 .8 .3 1.1 .5s.2 .6 .5 1.1zm-2.2 1.4c.5 0 .5-.3 .8-.3 .3-.3 .3-.5 .3-.8s0-.5-.3-.8c-.3 0-.5-.3-1.1-.3l-1.6 0 0 3.5 .8 0 0-1.4 .3 0 1.1 1.4 .8 0-1.1-1.3zM576 81l0 352c0 26.5-21.5 48-48 48L48 481c-26.5 0-48-21.5-48-48L0 81C0 54.5 21.5 33 48 33l480 0c26.5 0 48 21.5 48 48zM64 220.6c0 76.5 62.1 138.5 138.5 138.5 27.2 0 53.9-8.2 76.5-23.1-72.9-59.3-72.4-171.2 0-230.5-22.6-15-49.3-23.1-76.5-23.1-76.4-.1-138.5 62-138.5 138.2zM288 329.4c70.5-55 70.2-162.2 0-217.5-70.2 55.3-70.5 162.6 0 217.5z" />
            </svg>
          </div>
        </div>
      </div>
    </footer>
  );
}
