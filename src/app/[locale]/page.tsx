import { ProductCard } from "@/components/product-card";
import { Hero, type HeroContent } from "@/components/hero";
import { QuickOrder } from "@/components/quick-order";
import { BenefitsStrip } from "@/components/benefits-strip";
import { ShieldCheck, CreditCard, Wrench, CheckCircle, Headphones } from "lucide-react";
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

function Section({ title, products, viewAllHref, tr }: { title: React.ReactNode; products: any[]; viewAllHref?: string; tr: any }) {
  if (products.length === 0) return null;
  return (
    <section className="pt-[22px] pb-[70px]">
      <div className="mb-[10px] flex items-center justify-between">
        <h2 className="text-[23px] font-extrabold uppercase text-[#1d1d1f]">{title}</h2>
        {viewAllHref && (
          <a href={viewAllHref} className="text-[14px] font-semibold text-[#404b5a] hover:underline transition-colors">
            {tr.category.viewAll}
          </a>
        )}
      </div>
      <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

const seoBlocks = [
  {
    title: {
      ro: "Laptopuri premium în Moldova pentru business, gaming și studii",
      ru: "Премиум ноутбуки в Молдове для бизнеса, игр и учёбы",
      en: "Premium laptops in Moldova for business, gaming and studies",
    },
    desc: {
      ro: "ADAMO.MD este magazin specializat în laptopuri premium în Chișinău și Moldova: modele business, gaming, ultrabook-uri și laptopuri verificate pentru lucru, școală sau performanță.",
      ru: "ADAMO.MD — специализированный магазин премиум ноутбуков в Кишинёве и Молдове: бизнес-модели, игровые, ультрабуки и проверенные ноутбуки для работы, учёбы или производительности.",
      en: "ADAMO.MD is a specialized store for premium laptops in Chisinau and Moldova: business, gaming, ultrabooks and verified laptops for work, school or performance.",
    },
  },
  {
    title: {
      ro: "Laptopuri business verificate",
      ru: "Проверенные бизнес-ноутбуки",
      en: "Verified business laptops",
    },
    desc: {
      ro: "Modele stabile pentru birou, companii și freelanceri, cu SSD rapid, autonomie bună și suport inclus.",
      ru: "Стабильные модели для офиса, компаний и фрилансеров с быстрым SSD, хорошей автономностью и поддержкой.",
      en: "Stable models for office, companies and freelancers, with fast SSD, good battery life and included support.",
    },
  },
  {
    title: {
      ro: "Laptopuri gaming ASUS, MSI și Dell",
      ru: "Игровые ноутбуки ASUS, MSI и Dell",
      en: "Gaming laptops ASUS, MSI and Dell",
    },
    desc: {
      ro: "Configurații cu plăci video RTX, ecrane rapide și răcire puternică pentru jocuri, editare video și proiecte 3D.",
      ru: "Конфигурации с видеокартами RTX, быстрыми экранами и мощным охлаждением для игр, видеомонтажа и 3D-проектов.",
      en: "Configurations with RTX graphics, fast screens and powerful cooling for gaming, video editing and 3D projects.",
    },
  },
  {
    title: {
      ro: "Consultanță ADAMO.MD",
      ru: "Консультация ADAMO.MD",
      en: "ADAMO.MD consultation",
    },
    desc: {
      ro: "Te ajutăm să alegi laptopul potrivit după buget, scop și nivel de performanță, cu suport după cumpărare.",
      ru: "Помогаем выбрать подходящий ноутбук по бюджету, целям и уровню производительности, с поддержкой после покупки.",
      en: "We help you choose the right laptop by budget, purpose and performance level, with post-purchase support.",
    },
  },
];

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

  return (
    <div>
      <Hero content={hero} images={heroImages} />

      <BenefitsStrip tr={tr} />

      {wide && (
        <section className="pb-[70px]">
          <StaticBanner banner={wide} />
        </section>
      )}

      <Section title={<span className="inline-flex items-center gap-2"><svg viewBox="0 0 20 20" className="h-5 w-5" fill="#0b55d8"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>{tr.home.popular}</span>} products={popular} viewAllHref="/laptopuri?type=popular" tr={tr} />
      <Section title={tr.home.promotions} products={promotions} viewAllHref="/laptopuri?type=promotions" tr={tr} />

      {(tile1 || tile2) && (
        <section className="pb-[70px]">
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
            {tile1 && <StaticBanner banner={tile1} />}
            {tile2 && <StaticBanner banner={tile2} />}
          </div>
        </section>
      )}

      <Section title={tr.home.newProducts} products={newProducts} viewAllHref="/laptopuri?type=new" tr={tr} />

      <QuickOrder tr={tr} />

      <section className="mt-[30px] mb-[28px]">
        <h2 className="mb-[10px] text-center text-[18px] font-black uppercase text-[#1d1d1f]">
          {tr.home.whyTitle}
        </h2>
        <div className="grid grid-cols-2 overflow-hidden border border-[#e1e7ef] rounded-[9px] shadow-[0_18px_45px_rgba(31,41,55,0.08)] md:grid-cols-3 lg:grid-cols-5">
          {[
            { Icon: CheckCircle, title: tr.home.whyVerifiedTitle, desc: tr.home.whyVerifiedDesc },
            { Icon: ShieldCheck, title: tr.home.whyWarrantyTitle, desc: tr.home.whyWarrantyDesc },
            { Icon: CreditCard, title: tr.home.whyPaymentTitle, desc: tr.home.whyPaymentDesc },
            { Icon: Wrench, title: tr.home.whyServiceTitle, desc: tr.home.whyServiceDesc },
            { Icon: Headphones, title: tr.home.whySupportTitle, desc: tr.home.whySupportDesc },
          ].map((item, i, arr) => (
            <article
              key={item.title}
              className={`flex items-center gap-3 min-h-[74px] px-4 py-[14px] border-r border-[#e1e7ef] transition-colors duration-[.18s] hover:bg-[#f9fdf6] group ${i === arr.length - 1 ? "border-r-0" : ""}`}
            >
              <span className="flex-shrink-0 grid place-items-center w-[38px] h-[38px] text-[#111827] group-hover:text-[#2f7d25] transition-colors duration-[.18s]">
                <item.Icon className="h-[34px] w-[34px]" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[12px] font-medium uppercase text-[#1d1d1f] leading-[1.2] group-hover:text-[#2f7d25] transition-colors duration-[.18s]">{item.title}</h3>
                <p className="text-[12px] text-[#6b6c6c] leading-[1.35]">{item.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-[28px] mb-[34px]">
        <h2 className="max-w-[760px] mb-[10px] text-[25px] leading-[1.18] font-bold text-[#1d1d1f]">{seoBlocks[0].title[locale as keyof typeof seoBlocks[0]["title"]] || seoBlocks[0].title.ro}</h2>
        <p className="max-w-[870px] mb-[18px] text-[16px] leading-[1.6] text-[#536070]">{seoBlocks[0].desc[locale as keyof typeof seoBlocks[0]["desc"]] || seoBlocks[0].desc.ro}</p>
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {seoBlocks.slice(1).map((block) => (
            <article key={block.title.ro} className="pt-[18px] border-t border-[#e1e7ef]">
              <h3 className="text-[16px] leading-[1.25] font-bold text-[#1d1d1f] mb-2">{block.title[locale as keyof typeof block.title] || block.title.ro}</h3>
              <p className="text-[14px] leading-[1.55] text-[#697586]">{block.desc[locale as keyof typeof block.desc] || block.desc.ro}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
