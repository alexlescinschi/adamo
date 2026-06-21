import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getProductById, getCategoryProducts } from "@/lib/crm-api";
import { getDict } from "@/lib/translations";
import { ImageGallery } from "@/components/image-gallery";
import { ProductInfo } from "@/components/product-info";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const res = await fetch("https://api.crm.adamo.md/v1/ecommerce/products/ids?locale=ro", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const ids: number[] = data.ids || [];
    const slugs: string[] = data.slugs || [];
    const locales = ["ro", "ru", "en"];
    return locales.flatMap((locale) =>
      ids.map((id, i) => ({ locale, id: slugs[i] ? `${id}-${slugs[i]}` : String(id) }))
    );
  } catch {
    return [];
  }
}

function extractImage(product: any): { url: string }[] {
  if (product.images?.length) return product.images;
  if (product.image_url) return [{ url: product.image_url }];
  return [];
}

async function getProduct(id: string, locale = "ro") {
  const data = await getProductById(id, locale);
  const price = data.offerSummary?.minPrice || data.minPrice || data.price || 0;
  const oldPrice = data.discount?.originalPrice || data.oldPrice || data.old_price;
  const rawSpecs = Array.isArray(data.specs) ? data.specs : [];
  const specs = Object.fromEntries(rawSpecs.filter((s: any) => s.label).map((s: any) => [s.label, s.valueLabel]));
  const badge = rawSpecs.some((s: any) => s.label === "Recomandat" && s.valueLabel) ? "Recomandat" : undefined;
  const localeTranslation = Array.isArray(data.translations)
    ? data.translations.find((t: any) => t.locale === locale)
    : null;
  return {
    id: data.id,
    name: localeTranslation?.storefrontName || data.name || data.translation?.storefrontName,
    slug: data.slug,
    description: localeTranslation?.description || data.translation?.description || "",
    price,
    old_price: oldPrice > price ? oldPrice : undefined,
    image_url: data.images?.[0]?.url || data.previewImageUrl || null,
    images: extractImage(data),
    specs,
    badge,
    availability: data.offerSummary?.availability || "OutOfStock",
    category_slug: data.category?.storefrontPathSlug || data.category?.slug || null,
    category_name: data.category?.translation?.name || data.category?.name || null,
    units_total: data.offerSummary?.inventoryUnitCount ?? data.units_total ?? undefined,
  };
}

async function getSimilar(slug: string, currentId: number, locale = "ro") {
  try {
    const catData = await getCategoryProducts(slug, locale, 8);
    const items = Array.isArray(catData) ? catData : catData?.items || [];
    return items.filter((p: any) => p.id !== currentId).slice(0, 4).map((p: any) => ({
      id: p.id,
      name: p.storefrontName || p.name,
      price: p.offerSummary?.minPrice || p.minPrice || p.price || 0,
      image_url: p.imageUrl || p.previewImageUrl || null,
      unit_id: p.id,
    }));
  } catch {
    return [];
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id: rawId, locale } = await params;
  const id = rawId.split("-")[0];
  const tr = getDict(locale);
  let product: any = null;

  try {
    product = await getProduct(id, locale);
  } catch {}

  if (!product) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-[#1d1d1f]">{tr.product.notFound}</h1>
        <p className="mt-2 text-[#6b6c6c]">{tr.product.notFoundSub}</p>
        <Link href="/" className="mt-6 inline-block rounded-[28px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-3 text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all">
          {tr.product.back}
        </Link>
      </div>
    );
  }

  const similar = product.category_slug ? await getSimilar(product.category_slug, product.id, locale) : [];

  return (
    <div className="py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#4e8f28] hover:underline mb-6">
        <ChevronLeft className="h-4 w-4" />
        {tr.product.back}
      </Link>

      <div className="grid gap-[70px] md:grid-cols-2">
        <div className="min-w-0 md:sticky md:top-24 md:self-start">
          <div className="relative">
            <ImageGallery
              images={product.images}
              name={product.name}
            />
            {product.badge && (
              <span className="absolute top-3 left-3 z-10 rounded-[6px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-3 py-1.5 text-[12px] font-black uppercase text-white shadow-[0_3px_10px_rgba(99,173,54,0.3)]">
                {product.badge}
              </span>
            )}
          </div>
        </div>
        <div>
          <ProductInfo product={product} />
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-[70px]">
          <h2 className="text-xl font-semibold mb-6 text-[#1d1d1f]">{tr.product.similar}</h2>
          <div className="grid grid-cols-2 gap-[14px] md:grid-cols-4">
            {similar.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
