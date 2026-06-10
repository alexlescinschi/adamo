import { ProductCard } from "@/components/product-card";
import { HomeCarousel } from "@/components/home-carousel";
import { ShieldCheck, Truck, Percent, Package, Wrench } from "lucide-react";
import { getPopularProducts, getPromotions, getNewProducts, getPublishedProducts, getHomeCarousel, getHomeStaticBanners } from "@/lib/crm-api";
import { getCached } from "@/lib/redis";
import Image from "next/image";

export const revalidate = 60;

function extractProducts(data: any): any[] {
  const items = data?.items || data || [];
  return Array.isArray(items) ? items.map((item: any) => ({
    id: item.id,
    name: item.storefrontName || item.name,
    slug: item.slug,
    price: item.offerSummary?.minPrice || item.minPrice || item.price || 0,
    old_price: item.discount?.originalPrice || item.oldPrice || item.old_price,
    image_url: item.imageUrl || item.previewImageUrl || null,
    unit_id: item.id,
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
  try { data = await getCached(cacheKey, () => fetcher(locale, limit), 120); } catch { data = null; }
  if (!data?.items?.length) { try { data = await getPublishedProducts(locale, limit).catch(() => null); } catch {} }
  return extractProducts(data || {});
}

async function fetchCarousel(locale = "ro") {
  try {
    const data = await getCached("home:carousel", () => getHomeCarousel(locale), 300);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function fetchStaticBanners(locale = "ro") {
  try {
    const data = await getCached("home:static-banners", () => getHomeStaticBanners(locale), 300);
    return data || {};
  } catch { return {}; }
}

function Section({ title, products }: { title: string; products: any[] }) {
  if (products.length === 0) return null;
  return (
    <section className="py-[70px]">
      <h2 className="mb-6 text-xl font-semibold text-[#1d1d1f]">{title}</h2>
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

export default async function Home() {
  const [popular, promotions, newProducts, carousel, staticBanners] = await Promise.all([
    fetchProducts("popular"),
    fetchProducts("promotions"),
    fetchProducts("new"),
    fetchCarousel(),
    fetchStaticBanners(),
  ]);

  const { wide, tile1, tile2 } = staticBanners;

  return (
    <div>
      {carousel.length > 0 && (
        <section className="pt-8">
          <HomeCarousel slides={carousel} />
        </section>
      )}

      <section className="py-8 md:py-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
          {[
            { Icon: ShieldCheck, label: "Garanție 12 luni" },
            { Icon: Truck, label: "Livrare Gratuită toată Moldova" },
            { Icon: Percent, label: "Rate 0% fără dobândă" },
            { Icon: Package, label: "Achitare la primire" },
            { Icon: Wrench, label: "Service centru propriu" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-3 rounded-[28px] bg-[#f3f6f6] px-4 py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1d1d1f]">
                <item.Icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-[#1d1d1f]">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-[70px] text-center">
        <h1 className="text-[44px] font-semibold leading-tight tracking-[-0.031em] text-[#1d1d1f]">Magazinul Adamo</h1>
        <p className="mt-3 text-[17px] text-[#6b6c6c]">Produse de calitate la prețuri bune.</p>
      </section>

      {wide && (
        <section className="pb-[70px]">
          <StaticBanner banner={wide} />
        </section>
      )}

      <Section title="Produse populare" products={popular} />
      <Section title="Promoții" products={promotions} />

      {(tile1 || tile2) && (
        <section className="pb-[70px]">
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
            {tile1 && <StaticBanner banner={tile1} />}
            {tile2 && <StaticBanner banner={tile2} />}
          </div>
        </section>
      )}

      <Section title="Noutăți" products={newProducts} />
    </div>
  );
}
