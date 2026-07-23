import Link from "next/link";
import { CONTENT_PAGES } from "@/lib/content-pages";
import { getBlogPosts, getPublishedContentSlugs } from "@/lib/sanity";
import { localizedAlternates } from "@/lib/site";
import type { Metadata } from "next";

const titles = { ro: "Harta site-ului", ru: "Карта сайта", en: "Sitemap" };

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const language = locale === "ru" || locale === "en" ? locale : "ro";
  return {
    title: titles[language],
    openGraph: { title: titles[language], url: localizedAlternates(language, "/harta-site-ului").canonical },
    twitter: { title: titles[language] },
    alternates: localizedAlternates(language, "/harta-site-ului"),
  };
}

export default async function SitemapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const language = locale === "ru" || locale === "en" ? locale : "ro";
  const [posts, published] = await Promise.all([getBlogPosts(language), getPublishedContentSlugs()]);
  const publishedPages = new Set(published.pages.map((page) => page.slug));

  return (
    <div className="mx-auto max-w-3xl py-[70px]">
      <h1 className="mb-8 text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f]">{titles[language]}</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        <li><Link href={`/${language}`} className="text-[#34781f] hover:underline">ADAMO.MD</Link></li>
        <li><Link href={`/${language}/blog`} className="text-[#34781f] hover:underline">Blog</Link></li>
        {CONTENT_PAGES.filter((page) => page.slug === "contact" || publishedPages.has(page.slug)).map((page) => (
          <li key={page.slug}><Link href={`/${language}/${page.slug}`} className="text-[#34781f] hover:underline">{page.title[language]}</Link></li>
        ))}
        {posts.map((post) => (
          <li key={post.slug}><Link href={`/${language}/blog/${post.slug}`} className="text-[#34781f] hover:underline">{post.title}</Link></li>
        ))}
      </ul>
    </div>
  );
}
