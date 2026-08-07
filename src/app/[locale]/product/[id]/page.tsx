import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProductById, getCategoryProducts } from "@/lib/crm-api";
import { getDict } from "@/lib/translations";
import { ImageGallery } from "@/components/image-gallery";
import { ProductInfo } from "@/components/product-info";
import { ProductCard } from "@/components/product-card";
import { mapProductCard, extractBadge, extractCondition } from "@/lib/product-mapper";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const LOCALES = ["ro", "ru", "en"];

export async function generateStaticParams() {
  try {
    const res = await fetch("https://api.crm.adamo.md/v1/ecommerce/products/ids?locale=ro", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const ids: number[] = data.ids || [];
    const slugs: string[] = data.slugs || [];
    return LOCALES.flatMap((locale) =>
      ids.map((id, i) => ({ locale, id: slugs[i] ? `${id}-${slugs[i]}` : String(id) }))
    );
  } catch {
    return [];
  }
}

function extractImages(product: any): { url: string }[] {
  if (product.images?.length) return product.images;
  if (product.image_url) return [{ url: product.image_url }];
  return [];
}

async function getProduct(id: string, locale = "ro") {
  const data = await getProductById(id, locale);
  const price = data.offerSummary?.minPrice || data.minPrice || data.price || 0;
  const oldPrice = data.discount?.compareAtPrice || data.discount?.originalPrice || data.oldPrice || data.old_price;
  const rawSpecs = Array.isArray(data.specs) ? data.specs : [];
  const specs = Object.fromEntries(rawSpecs.filter((s: any) => s.label && String(s.code).toLowerCase() !== "sticker").map((s: any) => [s.label, s.valueLabel]));
  const { badge, badge_gradient } = extractBadge(data);
  const condition = extractCondition(data);
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
    images: extractImages(data),
    specs,
    // brand = primul spec cu code "brand" sau label "Бренд/Brand" (CRM îl returnează în specs).
    brand: rawSpecs.find((s: any) => s.code === "brand" || /^(Бренд|Brand|Бренд)$/i.test(s.label))?.valueLabel,
    badge,
    badge_gradient,
    condition,
    availability: data.offerSummary?.availability || "OutOfStock",
    category_slug: data.category?.storefrontPathSlug || data.category?.slug || null,
    category_name: data.category?.translation?.name || data.category?.name || null,
    units_total: data.offerSummary?.inventoryUnitCount ?? data.units_total ?? undefined,
    unit_id: data.units?.[0]?.id ?? data.offerSummary?.priceTiers?.[0]?.representativeUnitId ?? data.id,
    product_code: data.id,
  };
}

function productPath(locale: string, id: number | string, slug?: string) {
  return `/${locale}/product/${slug ? `${id}-${slug}` : id}`;
}

// ponytail: hreflang per-produs — același slug în toate locale (CRM returnează un singur slug),
// dar locale-prefix diferit. Rezolvă duplicate-content pentru Google.
function productLanguages(id: number, slug?: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `${SITE_URL}${productPath(l, id, slug)}`;
  languages["x-default"] = `${SITE_URL}${productPath("ro", id, slug)}`;
  return languages;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id: rawId, locale } = await params;
  const tr = getDict(locale);
  const id = rawId.split("-")[0];
  let product: any = null;
  try {
    product = await getProduct(id, locale);
  } catch {
    return {};
  }
  if (!product) return {};

  const url = `${SITE_URL}${productPath(locale, id, product.slug)}`;
  const desc =
    (product.description && product.description.slice(0, 160)) ||
    tr.metadata.productFallback.replace("{name}", product.name);
  const ogImages = (product.images?.length ? product.images : [])
    .map((im: any) => im.url)
    .filter(Boolean)
    .slice(0, 4)
    .map((u: string) => ({ url: u, width: 1000, height: 750, alt: product.name }));

  return {
    title: product.name,
    description: desc,
    alternates: {
      canonical: productPath(locale, id, product.slug),
      languages: productLanguages(Number(id), product.slug),
    },
    openGraph: {
      // ponytail: Next 16 nu include "product" în OpenGraph.type union; Facebook îl
      // afișează oricum ca produs via tag-urile product:* din `other` de mai jos.
      type: "website",
      url,
      title: product.name,
      description: desc,
      images: ogImages,
      siteName: "Adamo",
      locale: locale === "ro" ? "ro_MD" : locale === "ru" ? "ru_RU" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: desc,
      images: ogImages.map((i: any) => i.url),
    },
    // Facebook product OG tags
    other: {
      "product:price:amount": String(product.price || 0),
      "product:price:currency": "MDL",
      "product:availability":
        product.availability === "InStock" ? "instock" : "oos",
    },
  };
}

async function getSimilar(slug: string, currentId: number, locale = "ro") {
  try {
    const catData = await getCategoryProducts(slug, locale, { limit: 8 });
    const items = Array.isArray(catData) ? catData : catData?.items || [];
    return items.filter((p: any) => p.id !== currentId).slice(0, 4).map(mapProductCard);
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
        <Link href={`/${locale}`} className="mt-6 inline-block rounded-[28px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-3 text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all">
          {tr.product.back}
        </Link>
      </div>
    );
  }

  const similar = product.category_slug ? await getSimilar(product.category_slug, product.id, locale) : [];

  // JSON-LD: Product + Offer + BreadcrumbList (unu, nu duplicat ca openbox).
  const url = `${SITE_URL}${productPath(locale, id, product.slug)}`;
  const images = (product.images?.length ? product.images : [])
    .map((im: any) => im.url)
    .filter(Boolean);
  const inStock = product.availability === "InStock" || (product.units_total ?? 0) > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: product.description || undefined,
        sku: String(product.id),
        url,
        ...(images.length ? { image: images } : {}),
        ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
        ...(product.category_name ? { category: product.category_name } : {}),
        offers: {
          "@type": "Offer",
          price: String(product.price || 0),
          priceCurrency: "MDL",
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          priceValidUntil: "2026-12-31",
          url,
          seller: { "@type": "Organization", name: "Adamo" },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: tr.category.home, item: `${SITE_URL}/${locale}` },
          ...(product.category_slug && product.category_name
            ? [{
                "@type": "ListItem",
                position: 2,
                name: product.category_name,
                item: `${SITE_URL}/${locale}/category/${product.category_slug}`,
              }]
            : []),
          { "@type": "ListItem", position: product.category_slug ? 3 : 2, name: product.name, item: url },
        ],
      },
    ],
  };

  return (
    <div className="py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb vizual (ca openbox): semantic <nav>/<ol>/<li> */}
      <nav aria-label={tr.common.breadcrumb} className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-[#6b6c6c]">
          <li>
            <Link href={`/${locale}`} className="hover:text-[#1d1d1f] transition-colors">{tr.category.home}</Link>
          </li>
          <li role="presentation" className="text-[#cccfcf]"><ChevronRight className="h-4 w-4" /></li>
          {product.category_slug && product.category_name && (
            <>
              <li>
                <Link href={`/${locale}/category/${product.category_slug}`} className="hover:text-[#1d1d1f] transition-colors">
                  {product.category_name}
                </Link>
              </li>
              <li role="presentation" className="text-[#cccfcf]"><ChevronRight className="h-4 w-4" /></li>
            </>
          )}
          <li aria-current="page" className="text-[#1d1d1f] line-clamp-1 max-w-[200px] sm:max-w-md">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-[70px] md:grid-cols-2">
        <div className="min-w-0 md:sticky md:top-24 md:self-start">
          <div data-testid="product-gallery" className="relative">
            <ImageGallery
              images={product.images}
              name={product.name}
            />
            {product.badge && (
              <span className={`absolute top-3 left-3 z-10 rounded-[6px] px-3 py-1.5 text-[12px] font-black uppercase text-white shadow-[0_3px_10px_rgba(99,173,54,0.3)] bg-gradient-to-r ${product.badge_gradient || "from-[#7cc44e] to-[#63ad36]"}`}>
                {(tr as any).badges?.[product.badge] ?? product.badge}
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
          <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
            {similar.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
