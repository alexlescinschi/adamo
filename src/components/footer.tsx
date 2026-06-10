import Image from "next/image";
import Link from "next/link";
import { Phone, MessageCircle, MessageSquare, Mail, MapPin } from "lucide-react";

const PHONE = "+37379966909";

export function Footer() {
  return (
    <footer className="mt-[70px] border-t border-[#cccfcf]/50 bg-[#f3f6f6]">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">

          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <Image src="/logo.svg" alt="Adamo" width={120} height={28} className="h-6 w-auto" />
            </Link>
            <p className="text-sm text-[#6b6c6c] leading-relaxed">
              Produse de calitate la prețuri bune. Garanție 12 luni, livrare gratuită în toată Moldova.
            </p>
            <div className="space-y-2">
              <a href={`tel:${PHONE}`} className="flex items-center gap-2 text-sm text-[#444545] hover:text-[#1d1d1f] transition-colors">
                <Phone className="h-4 w-4 text-[#6b6c6c]" /> {PHONE}
              </a>
              <a href={`viber://chat?number=${PHONE}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#444545] hover:text-[#1d1d1f] transition-colors">
                <MessageCircle className="h-4 w-4 text-[#7360f2]" /> Viber
              </a>
              <a href={`https://wa.me/${PHONE}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#444545] hover:text-[#1d1d1f] transition-colors">
                <MessageSquare className="h-4 w-4 text-[#25d366]" /> WhatsApp
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#1d1d1f]">Magazin</h3>
            <div className="flex flex-col gap-3">
              <Link href="/minipc" className="text-sm text-[#6b6c6c] hover:text-[#1d1d1f] transition-colors">Mini-PC</Link>
              <Link href="/laptopuri" className="text-sm text-[#6b6c6c] hover:text-[#1d1d1f] transition-colors">Laptopuri</Link>
              <Link href="/warranty" className="text-sm text-[#6b6c6c] hover:text-[#1d1d1f] transition-colors">Garanție</Link>
              <Link href="/contact" className="text-sm text-[#6b6c6c] hover:text-[#1d1d1f] transition-colors">Contacte</Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#1d1d1f]">Informații</h3>
            <div className="flex flex-col gap-3">
              <Link href="/warranty" className="text-sm text-[#6b6c6c] hover:text-[#1d1d1f] transition-colors">Livrare și plată</Link>
              <Link href="/warranty" className="text-sm text-[#6b6c6c] hover:text-[#1d1d1f] transition-colors">Garanție</Link>
              <Link href="/politica-confidentzialinosti" className="text-sm text-[#6b6c6c] hover:text-[#1d1d1f] transition-colors">Confidențialitate</Link>
              <Link href="/contact" className="text-sm text-[#6b6c6c] hover:text-[#1d1d1f] transition-colors">Retur</Link>
              <Link href="/contact" className="text-sm text-[#6b6c6c] hover:text-[#1d1d1f] transition-colors">Termeni și condiții</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Adresa</h3>
            <div className="flex items-start gap-2 text-sm text-[#6b6c6c]">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#6b6c6c]" />
              <span>Chișinău, str. Alexandru cel Bun, 1</span>
            </div>
            <div className="overflow-hidden rounded-[14px] border border-[#cccfcf]/50">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d21778.848116171145!2d28.8354!3d47.0225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40c97c0350b8b3b7%3A0x1a1b1c1d1e1f1a1b!2sChi%C8%99in%C4%83u!5e0!3m2!1sro!2s!4v1"
                width="100%"
                height="150"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Adamo pe hartă"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#cccfcf]/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 md:flex-row">
          <span className="text-xs text-[#6b6c6c]">&copy; {new Date().getFullYear()} Adamo. Toate drepturile rezervate.</span>
          <Link href="/politica-confidentzialinosti" className="text-xs text-[#6b6c6c] hover:text-[#1d1d1f] transition-colors">
            Politica de confidențialitate
          </Link>
        </div>
      </div>
    </footer>
  );
}
