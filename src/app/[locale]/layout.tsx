import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContactWidget } from "@/components/contact-widget";
import { CartProvider } from "@/hooks/use-cart";
import { getCategories, getPublishedProducts } from "@/lib/crm-api";
import { extractCategories } from "@/lib/categories";
import { extractProducts } from "@/lib/product-mapper";

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

  let categories: Awaited<ReturnType<typeof extractCategories>> = [];
  try {
    const data = await getCategories(locale);
    categories = extractCategories(data);
  } catch {
    categories = [];
  }

  let products: any[] = [];
  try {
    const data = await getPublishedProducts(locale, 8);
    products = extractProducts(data);
  } catch {
    products = [];
  }

  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full flex flex-col font-sans bg-white text-[#1d1d1f]">
        <CartProvider>
          <Header categories={categories} products={products} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4">{children}</main>
          <Footer />
          <ContactWidget />
        </CartProvider>
      </body>
    </html>
  );
}
