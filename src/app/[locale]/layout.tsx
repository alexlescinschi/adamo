import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContactWidget } from "@/components/contact-widget";
import { CartProvider } from "@/hooks/use-cart";
import { getCategories } from "@/lib/crm-api";
import { extractCategories } from "@/lib/categories";

export function generateStaticParams() {
  return [{ locale: "ro" }, { locale: "ru" }, { locale: "en" }];
}

export const metadata: Metadata = {
  title: "Adamo - Magazin Online",
  description: "Magazinul oficial Adamo. Produse de calitate la prețuri bune.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Fetch categories server-side so the Header dropdown stays in sync with the
  // CRM (crmFetch revalidates every 60s). Falls back to an empty list on error
  // so the site never breaks if the CRM is temporarily unavailable.
  let categories: Awaited<ReturnType<typeof extractCategories>> = [];
  try {
    const data = await getCategories(locale);
    categories = extractCategories(data);
  } catch {
    categories = [];
  }

  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full flex flex-col font-sans bg-white text-[#1d1d1f]">
        <CartProvider>
          <Header categories={categories} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4">{children}</main>
          <Footer />
          <ContactWidget />
        </CartProvider>
      </body>
    </html>
  );
}
