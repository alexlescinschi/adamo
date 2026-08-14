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
import { getContactSettings, getPublishedContentSlugs } from "@/lib/sanity";
import { IS_STAGING, SITE_URL } from "@/lib/site";
import { getDict } from "@/lib/translations";

export function generateStaticParams() {
  return [{ locale: "ro" }, { locale: "ru" }, { locale: "en" }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const tr = getDict(locale);
  const openGraphLocale = locale === "ru" ? "ru_RU" : locale === "en" ? "en_US" : "ro_MD";
  const alternateOpenGraphLocales = ["ro_MD", "ru_RU", "en_US"].filter((item) => item !== openGraphLocale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: tr.metadata.defaultTitle,
      template: "%s — Adamo",
    },
    description: tr.metadata.defaultDescription,
    applicationName: "Adamo",
    icons: { icon: "/favicon.png?v=3", apple: "/favicon.png?v=3" },
    robots: IS_STAGING
      ? { index: false, follow: false, noarchive: true, googleBot: { index: false, follow: false } }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      type: "website",
      siteName: "Adamo",
      url: `${SITE_URL}/${locale}`,
      locale: openGraphLocale,
      alternateLocale: alternateOpenGraphLocales,
      title: tr.metadata.openGraphTitle,
      description: tr.metadata.openGraphDescription,
      images: [{ url: "/og-image.png", width: 626, height: 352, alt: tr.metadata.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: tr.metadata.twitterTitle,
      description: tr.metadata.twitterDescription,
      images: ["/og-image.png"],
    },
  };
}

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
      publicKey: iuteData?.public_api_key,
      lang: locale,
      scriptUrl: iuteData?.base_url ? `${iuteData.base_url}/iutepay.js` : undefined,
      styleUrl: iuteData?.base_url ? `${iuteData.base_url}/iutepay.css` : undefined,
    };
  } catch {
    // CRM unreachable — IutePay disabled
  }

  let contactSettings = null;
  let publishedContent: Awaited<ReturnType<typeof getPublishedContentSlugs>> = { pages: [], posts: [] };
  try {
    [contactSettings, publishedContent] = await Promise.all([
      getContactSettings(locale),
      getPublishedContentSlugs(),
    ]);
  } catch {
    // Sanity must not take down catalog, checkout or account routes.
  }

  return (
    <html lang={locale} className="h-full scroll-smooth overflow-x-clip">
      <body className="min-h-full flex flex-col font-sans text-[15px] text-[#111827] overflow-x-hidden overflow-x-clip" style={{ backgroundImage: "radial-gradient(circle at 80% 5%, rgba(23,105,232,.08), transparent 28%), radial-gradient(circle at 58% 11%, rgba(226,232,240,.78), transparent 16%), linear-gradient(180deg, #fff 0%, #f8fbff 54%, #fff 100%)", backgroundAttachment: "fixed", backgroundRepeat: "no-repeat" }}>
        <CartProvider>
          <Header categories={categories} products={products} publishedPageSlugs={publishedContent.pages.map((page) => page.slug)} />
          <main className="mx-auto w-full max-w-[1000px] flex-1 px-4 pb-[20px] lg:px-0">{children}</main>
          <Footer contact={contactSettings || undefined} publishedPageSlugs={publishedContent.pages.map((page) => page.slug)} />
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
