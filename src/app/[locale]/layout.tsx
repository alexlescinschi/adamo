import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContactWidget } from "@/components/contact-widget";
import { CartProvider } from "@/hooks/use-cart";
import { FavoritesProvider } from "@/hooks/use-favorites";

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
  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full flex flex-col font-sans bg-white text-[#1d1d1f]">
        <CartProvider>
          <FavoritesProvider>
            <Header />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4">{children}</main>
            <Footer />
            <ContactWidget />
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}
