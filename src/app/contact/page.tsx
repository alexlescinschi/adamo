import { MapPin, Phone, Mail, Clock, Building2, Shield } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="py-[70px]">
      <h1 className="text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f] mb-10">Contacte</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[#cccfcf]/50 p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5">
                <MapPin className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">Adresa oficiului</h2>
                <p className="mt-1 text-sm text-[#6b6c6c]">
                  Mun. Chișinău MD, Rîșcani, str. Dumitru Rîșcanu 11 (lingă scara 5)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5">
                <Phone className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">Telefon</h2>
                <a href="tel:+37379966909" className="mt-1 block text-sm text-[#4e8f28] hover:underline">
                  +373 79966909
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5">
                <Mail className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">Email</h2>
                <a href="mailto:adamomoldova@gmail.com" className="mt-1 block text-sm text-[#4e8f28] hover:underline">
                  adamomoldova@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5">
                <Clock className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">Orar de lucru</h2>
                <p className="mt-1 text-sm text-[#6b6c6c]">Ln-Vn: 09:00 - 17:00</p>
                <p className="text-sm text-[#6b6c6c]">S-D: Grafic liber - Apelați</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5">
                <Phone className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">Service centru</h2>
                <a href="tel:+37379966909" className="mt-1 block text-sm text-[#4e8f28] hover:underline">
                  +373 79966909
                </a>
                <p className="mt-1 text-sm text-[#6b6c6c]">Apelați pentru service și reparații</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#cccfcf]/50 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-[#63ad36]" />
              <h2 className="text-base font-semibold text-[#1d1d1f]">Rechizite bancare</h2>
            </div>
            <div className="text-sm text-[#6b6c6c] space-y-1">
              <p>Denumirea: Adamo SRL</p>
              <p>Cod fiscal: 123456789</p>
              <p>IBAN: MD12 AG01 2345 6789 0000 0000</p>
              <p>Banca: MAIB (Moldova Agroindbank)</p>
            </div>
          </div>

          <Link href="/politica-confidentzialinosti" className="flex items-center gap-3 rounded-[28px] border border-[#cccfcf]/50 p-6 hover:border-[#63ad36] transition-colors">
            <Shield className="h-5 w-5 text-[#63ad36]" />
            <div>
              <p className="text-sm font-semibold text-[#1d1d1f]">Politica de confidențialitate</p>
              <p className="text-xs text-[#6b6c6c]">Date despre consumatori</p>
            </div>
          </Link>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-[#cccfcf]/50 h-[400px] md:h-full min-h-[400px]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2717.8322!2d28.8223!3d47.0315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDfCsDAxJzUzLjQiTiAyOMKwNDknMjAuMyJF!5e0!3m2!1sro!2s!4v1!4m5!1m2!10m1!1e2!2m2!1d28.8223!2d47.0315"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Adamo - Strada Dumitru Rîșcanu 11, Chișinău"
          />
        </div>
      </div>
    </div>
  );
}
