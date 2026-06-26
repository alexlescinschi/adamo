import { getCategoryBySlug, getCategoryProducts } from "@/lib/crm-api";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { CategoryFilter } from "@/components/category-filter";
import { Suspense } from "react";
import { mapProductCard } from "@/lib/product-mapper";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const PER_PAGE = 24; // ponytail: ca openbox — paginare nativă în CRM

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const { page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);
  const name = await getCategoryBySlug(slug, locale)
    .then((c: any) => c?.name || c?.translation?.name || slug)
    .catch(() => slug);
  const title = `${name}${current > 1 ? ` — pagina ${current}` : ""}`;
  const qs = current > 1 ? `?page=${current}` : "";
  return {
    title,
    // self-referențial (corectează bug-ul openbox: fiecare pagină canonicalizează la sine)
    alternates: { canonical: `/${locale}/category/${slug}${qs}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug, locale } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  // ponytail: endpoint PUBLIC de storefront — carduri complete + paginare nativă.
  // try/catch → fallback "Nu sunt produse" în loc de 500.
  let products: any[] = [];
  let totalPages = 1;
  let total = 0;
  try {
    const data: any = await getCategoryProducts(slug, locale, {
      page: currentPage,
      limit: PER_PAGE,
    });
    products = (data?.items || []).map(mapProductCard);
    total = Number(data?.total) || products.length;
    totalPages = Math.max(1, Number(data?.totalPages) || Math.ceil(total / PER_PAGE));
  } catch {
    products = [];
  }

  const categoryName = await getCategoryBySlug(slug, locale)
    .then((c: any) => c?.name || c?.translation?.name || slug)
    .catch(() => slug);

  // JSON-LD ca openbox: CollectionPage + ItemList + Product/Offer + BreadcrumbList.
  const itemList = products.map((p: any, i: number) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Product",
      name: p.name,
      url: `/${locale}/product/${p.id}`,
      ...(p.image_url ? { image: p.image_url } : {}),
      offers: {
        "@type": "Offer",
        priceCurrency: "MDL",
        price: p.price || 0,
        availability:
          p.stock && p.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
      },
    },
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: categoryName,
        url: `/${locale}/category/${slug}`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: total,
          itemListElement: itemList,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `/${locale}` },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryName,
            item: `/${locale}/category/${slug}`,
          },
        ],
      },
    ],
  };

  return (
    <div className="py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex items-center gap-2 text-sm text-[#6b6c6c] mb-4">
        <Link href="/" className="hover:text-[#1d1d1f] transition-colors">
          Acasă
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[#1d1d1f]">{categoryName}</span>
      </div>
      <Suspense fallback={null}>
        <CategoryFilter
          products={products}
          categoryName={categoryName}
          page={currentPage}
          perPage={PER_PAGE}
          totalPages={totalPages}
          totalItems={total}
          serverPaginated
        />
      </Suspense>
    </div>
  );
}
