import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortableContent } from "@/components/portable-content";
import { ProductSection } from "@/components/product-section";
import { CONTENT_PAGES, contentPageTitle } from "@/lib/content-pages";
import { getContentPage } from "@/lib/sanity";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getContentPage(slug, locale);
  const title = page?.seoTitle || page?.title || contentPageTitle(slug, locale);
  if (!title) return {};
  const path = `/${locale}/${slug}`;
  return {
    title,
    description: page?.seoDescription,
    openGraph: { title, description: page?.seoDescription, url: `${SITE_URL}${path}` },
    twitter: { title, description: page?.seoDescription },
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        ro: `${SITE_URL}/ro/${slug}`,
        ru: `${SITE_URL}/ru/${slug}`,
        en: `${SITE_URL}/en/${slug}`,
        "x-default": `${SITE_URL}/ro/${slug}`,
      },
    },
  };
}

export default async function ContentPageRoute({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!CONTENT_PAGES.some((page) => page.slug === slug) || slug === "contact") notFound();
  const page = await getContentPage(slug, locale);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl py-[70px]">
      <h1 className="mb-8 text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f]">{page.title}</h1>
      <PortableContent value={page.body} />
      {slug === "promotii" && <ProductSection title={page.title} type="promotions" locale={locale} />}
    </div>
  );
}
