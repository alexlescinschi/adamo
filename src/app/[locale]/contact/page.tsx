import { MapPin, Phone, Mail, Clock, Building2, Shield } from "lucide-react";
import Link from "next/link";
import { getDict } from "@/lib/translations";
import { ADAMO_COMPANY } from "@/lib/company";
import { PortableContent } from "@/components/portable-content";
import { getContactSettings, getContentPage, getPublishedContentSlugs } from "@/lib/sanity";
import { localizedAlternates } from "@/lib/site";
import type { Metadata } from "next";

const EMAIL = "adamocomputers@gmail.com";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const tr = getDict(locale);
  const page = await getContentPage("contact", locale);
  const fallback = tr.contact.title;
  return {
    title: page?.seoTitle || page?.title || fallback,
    description: page?.seoDescription,
    openGraph: { title: page?.seoTitle || page?.title || fallback, description: page?.seoDescription, url: localizedAlternates(locale, "/contact").canonical },
    twitter: { title: page?.seoTitle || page?.title || fallback, description: page?.seoDescription },
    alternates: localizedAlternates(locale, "/contact"),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tr = getDict(locale);
  const c = tr.contact;
  const [page, settings, published] = await Promise.all([
    getContentPage("contact", locale),
    getContactSettings(locale),
    getPublishedContentSlugs(),
  ]);
  const email = settings?.email || EMAIL;

  return (
    <div className="py-[70px]">
      <h1 className="text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f] mb-8">{page?.title || c.title}</h1>
      {page?.body && <div className="mb-10 max-w-3xl"><PortableContent value={page.body} /></div>}

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
                <p className="mt-1 whitespace-pre-line text-sm text-[#6b6c6c]">{settings?.address || c.officeAddressValue}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5 flex-shrink-0">
                <Phone className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">{c.phone}</h2>
                <a href={`tel:${ADAMO_COMPANY.phone}`} className="mt-1 block text-sm text-[#4e8f28] hover:underline">
                  {ADAMO_COMPANY.phoneDisplay}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5 flex-shrink-0">
                <Mail className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">{tr.common.email}</h2>
                <a href={`mailto:${email}`} className="mt-1 block text-sm text-[#4e8f28] hover:underline break-all">
                  {email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5 flex-shrink-0">
                <Clock className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">{c.workHours}</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-[#6b6c6c]">{settings?.hours || `${c.workHoursValue}\n${c.weekendValue}`}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#f3f6f6] p-2.5 flex-shrink-0">
                <Phone className="h-5 w-5 text-[#63ad36]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">{c.serviceCenter}</h2>
                <a href={`tel:${ADAMO_COMPANY.phone}`} className="mt-1 block text-sm text-[#4e8f28] hover:underline">
                  {ADAMO_COMPANY.phoneDisplay}
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
                [c.regNumber, c.registrationWithDate.replace("{number}", ADAMO_COMPANY.regNumber).replace("{date}", ADAMO_COMPANY.regDate)],
                [c.vatCode, ADAMO_COMPANY.vatCode],
                [c.legalAddress, ADAMO_COMPANY.legalAddress],
                [c.bank, ADAMO_COMPANY.bank],
                [c.branch, ADAMO_COMPANY.branch],
                [tr.checkout.bicSwift, ADAMO_COMPANY.bic],
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
          {published.pages.some((item) => item.slug === "politica-de-confidentialitate") && (
            <Link
              href={`/${locale}/politica-de-confidentialitate`}
              className="flex items-center gap-3 rounded-[28px] border border-[#cccfcf]/50 p-6 hover:border-[#63ad36] transition-colors"
            >
              <Shield className="h-5 w-5 text-[#63ad36] flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#1d1d1f]">{tr.footer.privacyPolicy}</p>
                <p className="text-xs text-[#6b6c6c]">{c.privacyPolicySub}</p>
              </div>
            </Link>
          )}
        </div>

        {/* Map */}
        <div className="overflow-hidden rounded-[28px] border border-[#cccfcf]/50 h-[400px] md:h-full min-h-[400px]">
          <iframe
            src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2720!2d28.8643582!3d47.0367942!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40c97ddfed7eb7a9%3A0x6c229442d3cdc54f!2sAdamo!5e0!3m2!1s${locale}!2s!4v1&hl=${locale}`}
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
