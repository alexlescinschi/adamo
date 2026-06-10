"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, MapPin, Mail, Clock } from "lucide-react";
import { useParams } from "next/navigation";

const PHONE = "+37379966909";
const PHONE_DISPLAY = "+373 799 669 09";
const EMAIL = "adamocomputers@gmail.com";

export function Footer() {
  const params = useParams();
  const locale = (params?.locale as string) || "ro";
  const l = (path: string) => `/${locale}${path}`;
  return (
    <footer className="mt-[70px] border-t border-[#e4e8e4] bg-[#f7f9f7]">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href={l("/")} className="mb-4 flex items-center">
              <Image src="/logo.svg" alt="Adamo" width={120} height={28} className="h-6 w-auto" />
            </Link>
            <p className="mt-4 text-[14px] leading-[1.55] text-[#536070]">
              Magazin specializat în mini-PC și laptopuri. Import direct, garanție 12 luni, livrare gratuită în Moldova.
            </p>
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
            <h3 className="mb-[14px] text-[14px] font-bold uppercase tracking-wide text-[#1d1d1f]">Magazin</h3>
            <div className="flex flex-col gap-[10px]">
              <Link href={l("/minipc")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">Mini-PC</Link>
              <Link href={l("/laptopuri")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">Laptopuri</Link>
              <Link href={l("/warranty")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">Garanție</Link>
              <Link href={l("/contact")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">Contacte</Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-[14px] text-[14px] font-bold uppercase tracking-wide text-[#1d1d1f]">Informații</h3>
            <div className="flex flex-col gap-[10px]">
              <Link href={l("/warranty")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">Livrare și plată</Link>
              <Link href={l("/warranty")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">Garanție</Link>
              <Link href={l("/contact")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">Retur</Link>
              <Link href={l("/politica-confidentzialinosti")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">Confidențialitate</Link>
              <Link href={l("/contact")} className="text-[14px] leading-[1.45] text-[#536070] hover:text-[#1d1d1f] transition-colors">Termeni și condiții</Link>
            </div>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="mb-[14px] text-[14px] font-bold uppercase tracking-wide text-[#1d1d1f]">Contacte</h3>
            <div className="flex flex-col gap-[10px] text-[14px] leading-[1.45] text-[#536070]">
              <p>mun. Chișinău, Rîșcani<br />str. Dumitru Rîșcanu 11</p>
              <a href={`tel:${PHONE}`} className="font-bold text-[#263142] hover:text-[#34781f] transition-colors">{PHONE_DISPLAY}</a>
              <a href={`mailto:${EMAIL}`} className="hover:text-[#1d1d1f] transition-colors break-all">{EMAIL}</a>
              <p>Luni – Vineri: 09:00 – 18:00<br />Sâmbătă: 10:00 – 16:00</p>
            </div>
          </div>

          {/* Subscribe */}
          <div>
            <h3 className="mb-[14px] text-[14px] font-bold uppercase tracking-wide text-[#1d1d1f]">Abonează-te</h3>
            <p className="mb-4 text-[14px] leading-[1.45] text-[#536070]">Primește oferte și noutăți direct pe email</p>
            <form className="flex overflow-hidden rounded-[9px] border border-[#e4e8e4] bg-white focus-within:border-[#63ad36] transition-colors">
              <input
                type="email"
                placeholder="Emailul tău"
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
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 md:flex-row">
          <span className="text-[12px] text-[#6b6c6c]">&copy; {new Date().getFullYear()} Adamo — Toate drepturile rezervate. Creat în Moldova.</span>
          <Link href={l("/politica-confidentzialinosti")} className="text-[12px] text-[#6b6c6c] hover:text-[#1d1d1f] transition-colors">
            Politica de confidențialitate
          </Link>
        </div>
      </div>
    </footer>
  );
}
