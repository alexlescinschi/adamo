import { ProductCard } from "@/components/product-card";
import { Hero, type HeroContent } from "@/components/hero";
import { ShieldCheck, Truck, Percent, Package, Wrench } from "lucide-react";
import { getPopularProducts, getPromotions, getNewProducts, getPublishedProducts, getHomeCarousel, getHomeStaticBanners } from "@/lib/crm-api";
import { getDict } from "@/lib/translations";
import Image from "next/image";
import heroContent from "../../../content/hero.json";

export const dynamic = "force-dynamic";

function extractSpecs(item: any): string[] {
  if (item.cardSpecs) {
    return String(item.cardSpecs).split("|").map((s: string) => s.trim()).filter(Boolean).slice(0, 5);
  }
  const raw = item.specs || item.shortSpecs || item.attributes || [];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s: any) => s.label && s.valueLabel)
    .slice(0, 5)
    .map((s: any) => `${s.label}: ${s.valueLabel}`);
}

function extractProducts(data: any): any[] {
  const items = data?.items || data || [];
  return Array.isArray(items) ? items.map((item: any) => ({
    id: item.id,
    name: item.storefrontName || item.name,
    slug: item.slug,
    price: item.offerSummary?.minPrice || item.minPrice || item.price || 0,
    old_price: item.discount?.compareAtPrice || item.discount?.originalPrice || item.oldPrice || item.old_price,
    image_url: item.imageUrl || item.previewImageUrl || null,
    unit_id: item.id,
    specs: extractSpecs(item),
  })) : [];
}

async function fetchProducts(type: string, locale = "ro", limit = 8) {
  const cacheKey = `home:${type}:${locale}:${limit}`;
  const fetchers: Record<string, (l: string, lim: number) => Promise<any>> = {
    popular: getPopularProducts,
    promotions: getPromotions,
    new: getNewProducts,
  };
  const fetcher = fetchers[type] || getPopularProducts;
  let data;
  try { data = await fetcher(locale, limit); } catch { data = null; }
  if (!data?.items?.length) { try { data = await getPublishedProducts(locale, limit).catch(() => null); } catch {} }
  return extractProducts(data || {});
}

async function fetchCarousel(locale = "ro") {
  try {
    const data = await getHomeCarousel(locale);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function fetchStaticBanners(locale = "ro") {
  try {
    const data = await getHomeStaticBanners(locale);
    return data || {};
  } catch { return {}; }
}

function Section({ title, products, viewAllHref }: { title: string; products: any[]; viewAllHref?: string }) {
  if (products.length === 0) return null;
  return (
    <section className="py-[70px]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[22px] font-extrabold text-[#1d1d1f]">{title}</h2>
        {viewAllHref && (
          <a href={viewAllHref} className="text-[14px] font-semibold text-[#34781f] hover:underline transition-colors">
            Vezi toate
          </a>
        )}
      </div>
      <div className="grid grid-cols-2 gap-[14px] md:grid-cols-3 lg:grid-cols-4">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function StaticBanner({ banner }: { banner: any }) {
  if (!banner?.mediaUrl) return null;
  const img = (
    <Image
      src={banner.mediaUrl}
      alt={banner.altText || ""}
      fill
      className="rounded-[28px] object-cover"
    />
  );
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-[28px] bg-[#f3f6f6]">
      {banner.linkUrl ? (
        <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tr = getDict(locale);
  const [popular, promotions, newProducts, carousel, staticBanners] = await Promise.all([
    fetchProducts("popular", locale),
    fetchProducts("promotions", locale),
    fetchProducts("new", locale),
    fetchCarousel(locale),
    fetchStaticBanners(locale),
  ]);

  const hero = (heroContent as Record<string, HeroContent>)[locale] || (heroContent as Record<string, HeroContent>).ro;
  const heroImages = carousel.map((c: any) => c.mediaUrl).filter(Boolean) as string[];

  const { wide, tile1, tile2 } = staticBanners;

  const benefits = [
    { Icon: ShieldCheck, title: tr.home.benefitWarranty, sub: tr.home.benefitWarrantySub },
    { Icon: Truck, title: tr.home.benefitDelivery, sub: tr.home.benefitDeliverySub },
    { Icon: Percent, title: tr.home.benefitInstallments, sub: tr.home.benefitInstallmentsSub },
    { Icon: Package, title: tr.home.benefitPayment, sub: tr.home.benefitPaymentSub },
    { Icon: Wrench, title: tr.home.benefitService, sub: tr.home.benefitServiceSub },
  ];

  return (
    <div>
      <Hero content={hero} images={heroImages} />

      <section className="py-8 md:py-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-5">
          {benefits.map((item) => (
            <div key={item.title} className="flex items-center gap-3 rounded-[12px] bg-white px-4 py-5 shadow-[0_2px_12px_rgba(31,41,55,0.07)]">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7cc44e] to-[#63ad36] shadow-[0_4px_12px_rgba(99,173,54,0.25)]">
                <item.Icon className="h-5 w-5 text-white" />
              </div>
              <div className="grid leading-[1.2]">
                <b className="text-[13px] font-bold text-[#1d1d1f]">{item.title}</b>
                <span className="text-[12px] text-[#6b6c6c]">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {wide && (
        <section className="pb-[70px]">
          <StaticBanner banner={wide} />
        </section>
      )}

      <Section title={tr.home.popular} products={popular} viewAllHref="/minipc" />
      <Section title={tr.home.promotions} products={promotions} viewAllHref="/minipc" />

      {(tile1 || tile2) && (
        <section className="pb-[70px]">
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
            {tile1 && <StaticBanner banner={tile1} />}
            {tile2 && <StaticBanner banner={tile2} />}
          </div>
        </section>
      )}

      <Section title={tr.home.newProducts} products={newProducts} viewAllHref="/laptopuri" />

      <section className="py-[70px] border-t border-[#e4e8e4]">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#1d1d1f] mb-3">Laptopuri premium în Moldova pentru business, gaming și studii</h3>
            <p className="text-[14px] leading-[1.6] text-[#6b6c6c]">ADAMO.MD este magazin specializat în laptopuri premium în Chișinău și Moldova: modele business, gaming, ultrabook-uri și laptopuri verificate pentru lucru, școală sau performanță.</p>
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-[#1d1d1f] mb-3">Laptopuri business verificate</h3>
            <p className="text-[14px] leading-[1.6] text-[#6b6c6c]">Modele stabile pentru birou, companii și freelanceri, cu SSD rapid, autonomie bună și suport inclus.</p>
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-[#1d1d1f] mb-3">Laptopuri gaming ASUS, MSI și Dell</h3>
            <p className="text-[14px] leading-[1.6] text-[#6b6c6c]">Configurații cu plăci video RTX, ecrane rapide și răcire puternică pentru jocuri, editare video și proiecte 3D.</p>
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-[#1d1d1f] mb-3">Consultanță ADAMO.MD</h3>
            <p className="text-[14px] leading-[1.6] text-[#6b6c6c]">Te ajutăm să alegi laptopul potrivit după buget, scop și nivel de performanță, cu suport după cumpărare.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
