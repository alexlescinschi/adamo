import { MapPin, Phone, Mail, Clock, Building2, Shield } from "lucide-react";
import Link from "next/link";
import { getDict } from "@/lib/translations";
import { ADAMO_COMPANY } from "@/lib/company";

const PHONE = "+37379966909";
const PHONE_DISPLAY = "0 799 66 909";
const EMAIL = "adamocomputers@gmail.com";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tr = getDict(locale);
  const c = tr.contact;

  return (
    <div className="py-[70px]">
      <h1 className="text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f] mb-10">{c.title}</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">

          {/* General info */}
          <div className="rounded-[28px] border border-[#cccfcf]/50 p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5 flex-shrink-0">
                <MapPin className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">{c.officeAddress}</h2>
                <p className="mt-1 text-sm text-[#6b6c6c]">{c.officeAddressValue}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5 flex-shrink-0">
                <Phone className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">{c.phone}</h2>
                <a href={`tel:${PHONE}`} className="mt-1 block text-sm text-[#4e8f28] hover:underline">
                  {PHONE_DISPLAY}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5 flex-shrink-0">
                <Mail className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">Email</h2>
                <a href={`mailto:${EMAIL}`} className="mt-1 block text-sm text-[#4e8f28] hover:underline break-all">
                  {EMAIL}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5 flex-shrink-0">
                <Clock className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">{c.workHours}</h2>
                <p className="mt-1 text-sm text-[#6b6c6c]">{c.workHoursValue}</p>
                <p className="text-sm text-[#6b6c6c]">{c.weekendValue}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5 flex-shrink-0">
                <Phone className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">{c.serviceCenter}</h2>
                <a href={`tel:${PHONE}`} className="mt-1 block text-sm text-[#4e8f28] hover:underline">
                  {PHONE_DISPLAY}
                </a>
                <p className="mt-1 text-sm text-[#6b6c6c]">{c.serviceSub}</p>
              </div>
            </div>
          </div>

          {/* Bank details */}
          <div className="rounded-[28px] border border-[#cccfcf]/50 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-[#63ad36]" />
              <h2 className="text-base font-semibold text-[#1d1d1f]">{c.bankDetails}</h2>
            </div>
            <div className="divide-y divide-[#f0f0f0] text-sm">
              {[
                [c.companyLabel, ADAMO_COMPANY.name],
                [c.regNumber, `${ADAMO_COMPANY.regNumber} din ${ADAMO_COMPANY.regDate}`],
                [c.vatCode, ADAMO_COMPANY.vatCode],
                [c.legalAddress, ADAMO_COMPANY.legalAddress],
                [c.bank, ADAMO_COMPANY.bank],
                [c.branch, ADAMO_COMPANY.branch],
                ["BIC/SWIFT", ADAMO_COMPANY.bic],
                [c.currency, ADAMO_COMPANY.currency],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2">
                  <span className="text-[#6b6c6c] flex-shrink-0">{label}</span>
                  <span className="font-medium text-[#1d1d1f] text-right">{value}</span>
                </div>
              ))}
              {/* IBAN — separate row for visibility */}
              <div className="py-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-[#6b6c6c] text-sm">IBAN</span>
                </div>
                <p className="font-semibold text-[#1d1d1f] text-[13px] tracking-wide break-all">
                  {ADAMO_COMPANY.iban}
                </p>
              </div>
            </div>
          </div>

          {/* Privacy link */}
          <Link
            href={`/${locale}/politica-confidentzialinosti`}
            className="flex items-center gap-3 rounded-[28px] border border-[#cccfcf]/50 p-6 hover:border-[#63ad36] transition-colors"
          >
            <Shield className="h-5 w-5 text-[#63ad36] flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#1d1d1f]">{tr.footer.privacyPolicy}</p>
              <p className="text-xs text-[#6b6c6c]">{c.privacyPolicySub}</p>
            </div>
          </Link>
        </div>

        {/* Map */}
        <div className="overflow-hidden rounded-[28px] border border-[#cccfcf]/50 h-[400px] md:h-full min-h-[400px]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2717.8322!2d28.8223!3d47.0315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDfCsDAxJzUzLjQiTiAyOMKwNDknMjAuMyJF!5e0!3m2!1sro!2s!4v1!4m5!1m2!10m1!1e2!2m2!1d28.8223!2d47.0315"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Adamo Computers"
          />
        </div>
      </div>
    </div>
  );
}
