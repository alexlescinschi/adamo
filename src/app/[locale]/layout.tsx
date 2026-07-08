import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContactWidget } from "@/components/contact-widget";
import { IuteScript } from "@/components/iute-script";
import { CartProvider } from "@/hooks/use-cart";
import { getCategories, getNewProducts, crmFetch } from "@/lib/crm-api";
import { extractCategories } from "@/lib/categories";
import { extractProducts } from "@/lib/product-mapper";
import { getCached } from "@/lib/redis";

export const SITE_URL = "https://adamo3.vercel.app";
// ponytail: schimbă în https://adamo.md după config domeniu Vercel
const LOCALES = ["ro", "ru", "en"];

export function generateStaticParams() {
  return [{ locale: "ro" }, { locale: "ru" }, { locale: "en" }];
}

// ponytail: hreflang default pentru toate paginile. Per-pagină îl poate suprascrie
// cu canonical self-referențial (ex: product/category își setează propriul alternates).
function hreflang(path: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `${SITE_URL}/${l}${path}`;
  languages["x-default"] = `${SITE_URL}/ro${path}`; // piața principală: Moldova
  return languages;
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Adamo — Magazin Online",
    template: "%s — Adamo",
  },
  description: "Magazinul oficial Adamo. Produse de calitate la prețuri bune.",
  applicationName: "Adamo",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { languages: hreflang("") },
  openGraph: {
    type: "website",
    siteName: "Adamo",
    url: SITE_URL,
    locale: "ro_MD",
    alternateLocale: ["ru_MD", "en_US"],
    title: "Adamo — Laptopuri premium în Moldova",
    description: "Laptopuri premium, business și gaming în Moldova. Garanție 12 luni, livrare gratuită și rate 0%.",
    images: [{ url: "/og-image.png", width: 626, height: 352, alt: "Adamo — Laptopuri premium" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adamo — Laptopuri premium",
    description: "Laptopuri premium, business și gaming în Moldova.",
    images: ["/og-image.png"],
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let categories: Awaited<ReturnType<typeof extractCategories>> = [];
  try {
    const data = await getCategories(locale);
    categories = extractCategories(data);
  } catch {
    categories = [];
  }

  let products: any[] = [];
  try {
    // ponytail: storefront endpoint (new) vine cu preț/imagine/badge complete, zero enrichment
    const data = await getCached(
      `header-products:${locale}:8`,
      () => getNewProducts(locale, 8),
      300
    );
    products = extractProducts(data);
  } catch {
    products = [];
  }

  // ponytail: IutePay config from CRM (public key, base URL, lang).
  // CRM endpoint: GET /ecommerce/checkout/iute/config → { enabled, merchant }
  let iuteConfig: { enabled: boolean; publicKey?: string; lang?: string; scriptUrl?: string; styleUrl?: string } = { enabled: false };
  try {
    const iuteData = await crmFetch("/ecommerce/checkout/iute/config", {
      signal: AbortSignal.timeout(5000),
    });
    iuteConfig = {
      enabled: iuteData?.enabled ?? false,
      publicKey: iuteData?.merchant?.publicKey || iuteData?.publicKey,
      lang: iuteData?.merchant?.lang || iuteData?.lang || locale,
      scriptUrl: iuteData?.merchant?.scriptUrl || iuteData?.scriptUrl,
      styleUrl: iuteData?.merchant?.styleUrl || iuteData?.styleUrl,
    };
  } catch {
    // CRM unreachable — IutePay disabled
  }

  return (
    <html lang={locale} className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col font-sans text-[15px] text-[#111827] overflow-x-hidden overflow-x-clip" style={{ backgroundImage: "radial-gradient(circle at 80% 5%, rgba(23,105,232,.08), transparent 28%), radial-gradient(circle at 58% 11%, rgba(226,232,240,.78), transparent 16%), linear-gradient(180deg, #fff 0%, #f8fbff 54%, #fff 100%)", backgroundAttachment: "fixed", backgroundRepeat: "no-repeat" }}>
        <CartProvider>
          <Header categories={categories} products={products} />
          <main className="mx-auto w-full max-w-[1000px] flex-1 px-4 pb-[20px] lg:px-0">{children}</main>
          <Footer />
          <ContactWidget />
        </CartProvider>

        {/* ponytail: IutePay config from CRM. Zero env vars — everything from /config endpoint. */}
        <IuteScript
          enabled={iuteConfig.enabled}
          publicKey={iuteConfig.publicKey}
          lang={iuteConfig.lang}
          scriptUrl={iuteConfig.scriptUrl}
          styleUrl={iuteConfig.styleUrl}
        />
      </body>
    </html>
  );
}
