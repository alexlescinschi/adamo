import { ProductCard } from "@/components/product-card";
import { Hero, type HeroContent } from "@/components/hero";
import { ShieldCheck, Truck, Percent, CreditCard, RefreshCcw, Wrench } from "lucide-react";
import { getPublishedProducts, getNewProducts, getProductById, getHomeCarousel, getHomeStaticBanners } from "@/lib/crm-api";
import { getDict } from "@/lib/translations";
import { extractProducts, mapProductCard, hasAttribute } from "@/lib/product-mapper";
import Image from "next/image";
import heroContent from "../../../content/hero.json";

export const dynamic = "force-dynamic";

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

async function fetchAndEnrich(locale: string) {
  const [publishedData, newData] = await Promise.all([
    getPublishedProducts(locale, 80).catch(() => ({ items: [] })),
    getNewProducts(locale, 12).catch(() => ({ items: [] })),
  ]);

  const published = extractProducts(publishedData);
  const newList = extractProducts(newData);
  const allProducts = [...published, ...newList];

  const ids = [...new Set(allProducts.map((p: any) => p.id))];
  const details = await Promise.allSettled(
    ids.map((id: number) => getProductById(id, locale).catch(() => null))
  );
  const detailMap = new Map<number, any>();
  details.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) detailMap.set(ids[i], r.value);
  });

  const enriched = allProducts.map((p: any) => {
    const detail = detailMap.get(p.id);
    if (!detail) return p;
    const mapped = mapProductCard(detail);
    return {
      ...p,
      price: mapped.price || p.price,
      old_price: mapped.old_price || p.old_price,
      badge: mapped.badge,
      badge_type: mapped.badge_type,
      specs: mapped.specs || p.specs,
      is_popular: hasAttribute(detail, "popular"),
    };
  });

  const deduped = [...new Map(enriched.map((p: any) => [p.id, p])).values()] as any[];

  return {
    popular: deduped.filter((p: any) => p.is_popular).slice(0, 8),
    promotions: deduped.filter((p: any) => p.old_price && p.old_price > p.price).sort((a: any, b: any) => ((b.old_price - b.price) / b.old_price) - ((a.old_price - a.price) / a.old_price)).slice(0, 8),
    newProducts: deduped.filter((p: any) => newList.some((n: any) => n.id === p.id)).slice(0, 8),
  };
}

function Section({ title, products, viewAllHref }: { title: React.ReactNode; products: any[]; viewAllHref?: string }) {
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
  const [{ popular, promotions, newProducts }, carousel, staticBanners] = await Promise.all([
    fetchAndEnrich(locale),
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
    { Icon: CreditCard, title: tr.home.benefitPayment, sub: tr.home.benefitPaymentSub },
    { Icon: RefreshCcw, title: tr.home.benefitReturn, sub: tr.home.benefitReturnSub },
    { Icon: Wrench, title: tr.home.benefitService, sub: tr.home.benefitServiceSub },
  ];

  return (
    <div>
      <Hero content={hero} images={heroImages} />

      <section className="py-8 md:py-12">
        <div className="grid grid-cols-2 divide-x divide-[#e4e8e4] divide-y divide-[#e4e8e4] border border-[#e4e8e4] rounded-[9px] bg-white shadow-[0_1px_4px_rgba(31,41,55,0.06)] overflow-hidden md:grid-cols-3 lg:grid-cols-6">
          {benefits.map((item) => (
            <div key={item.title} className="group flex items-center gap-2 px-3 py-4 hover:bg-[#f9fdf6] transition-colors cursor-pointer">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center text-[#111827] group-hover:text-[#2f7d25] transition-colors">
                <item.Icon className="h-8 w-8" strokeWidth={2} />
              </div>
              <div className="grid leading-[1.2] min-w-0">
                <b className="text-[11px] font-extrabold uppercase text-[#1d1d1f] group-hover:text-[#2f7d25] transition-colors">{item.title}</b>
                <span className="text-[12px] text-[#6b6c6c] whitespace-nowrap">{item.sub}</span>
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

      <Section title={<span className="inline-flex items-center gap-2"><svg viewBox="0 0 20 20" className="h-5 w-5" fill="#0b55d8"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>{tr.home.popular}</span>} products={popular} viewAllHref="/minipc" />
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
