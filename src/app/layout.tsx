import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContactWidget } from "@/components/contact-widget";
import { CartProvider } from "@/hooks/use-cart";
import { FavoritesProvider } from "@/hooks/use-favorites";

export const metadata: Metadata = {
  title: "Adamo - Magazin Online",
  description: "Magazinul oficial Adamo. Produse de calitate la prețuri bune.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className="h-full">
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
