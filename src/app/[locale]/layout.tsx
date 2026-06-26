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
    <html lang={locale} className="h-full overflow-x-hidden scroll-smooth">
      <body className="min-h-full flex flex-col font-sans text-[15px] text-[#111827] overflow-x-hidden" style={{ backgroundImage: "radial-gradient(circle at 80% 5%, rgba(23,105,232,.08), transparent 28%), radial-gradient(circle at 58% 11%, rgba(226,232,240,.78), transparent 16%), linear-gradient(180deg, #f5f9ff 0%, #e8f1fc 54%, #f5f9ff 100%)", backgroundAttachment: "fixed", backgroundRepeat: "no-repeat" }}>
        <CartProvider>
          <Header categories={categories} products={products} />
          <main className="mx-auto w-full max-w-[1000px] flex-1 px-4 pb-[20px] lg:px-0">{children}</main>
          <Footer />
          <ContactWidget />
        </CartProvider>
      </body>
    </html>
  );
}
