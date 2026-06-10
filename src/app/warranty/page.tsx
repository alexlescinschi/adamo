import { Truck, ShieldCheck, BadgePercent, Star } from "lucide-react";

export default function WarrantyPage() {
  return (
    <div className="py-[70px] max-w-3xl">
      <h1 className="text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f] mb-10">Garanție și Livrare</h1>

      <div className="space-y-6">
        <div className="rounded-[28px] border border-[#cccfcf]/50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-[#f3f6f6] p-2.5">
              <Truck className="h-5 w-5 text-[#63ad36]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1d1d1f]">Care este costul si termenii de livrare?</h2>
              <p className="mt-3 text-sm text-[#6b6c6c] leading-relaxed">
                Livrarea este <strong className="text-[#1d1d1f]">gratuită</strong> pe întreg teritoriul Republicii Moldova.
              </p>
              <p className="mt-2 text-sm text-[#6b6c6c] leading-relaxed">
                Se efectuează de luni până vineri.
              </p>
              <p className="mt-2 text-sm text-[#6b6c6c] leading-relaxed">
                Termen: <strong className="text-[#1d1d1f]">1-2 zile lucrătoare</strong>.
              </p>
              <p className="mt-2 text-sm text-[#6b6c6c] leading-relaxed">
                Achitați la primirea produsului.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#cccfcf]/50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-[#f3f6f6] p-2.5">
              <ShieldCheck className="h-5 w-5 text-[#63ad36]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1d1d1f]">Există o garanție pentru produse și ce include aceasta?</h2>
              <p className="mt-3 text-sm text-[#6b6c6c] leading-relaxed">
                La magazinul Adamo.md, veți beneficia întotdeauna de garanție pentru produsele cumpărate, conform legilor și politicilor comerciale în vigoare ale producătorilor. Odată cu produsul, veți primi servicii gratuite de reparație de la vânzător sau producător pe baza certificatului de garanție emis.
              </p>
              <p className="mt-3 text-sm text-[#6b6c6c] leading-relaxed">
                Perioada de reparație este stabilită între <strong className="text-[#1d1d1f]">15 zile calendaristice și o lună</strong> de la data acceptării cererii de către service centru Adamo.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#cccfcf]/50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-[#f3f6f6] p-2.5">
              <BadgePercent className="h-5 w-5 text-[#63ad36]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1d1d1f]">De ce aveți prețuri atât de bune?</h2>
              <div className="mt-3 space-y-3">
                <p className="text-sm text-[#6b6c6c] leading-relaxed">
                  <strong className="text-[#1d1d1f]">1.</strong> Noi nu achitam arendă scumpă, nu investim sume mari în reclamă dar clienții noștri ne recomandă.
                </p>
                <p className="text-sm text-[#6b6c6c] leading-relaxed">
                  <strong className="text-[#1d1d1f]">2.</strong> Vindem în cantități mari cu marjă de profit mică.
                </p>
                <p className="text-sm text-[#6b6c6c] leading-relaxed">
                  <strong className="text-[#1d1d1f]">3.</strong> Suntem importatori direcți, de aceea produsele nu adaugă suplimentar la preț.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#cccfcf]/50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-[#f3f6f6] p-2.5">
              <Star className="h-5 w-5 text-[#63ad36]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1d1d1f]">Oferte speciale</h2>
              <p className="mt-3 text-sm text-[#6b6c6c] leading-relaxed">
                Pentru cantități mari și clienți fideli avem oferte speciale. Contactați-ne pentru detalii!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
