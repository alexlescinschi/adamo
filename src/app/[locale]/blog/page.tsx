import type { Metadata } from "next";
import { BlogList } from "@/components/blog-list";
import { getPaginatedBlogPosts } from "@/lib/sanity";
import { localizedAlternates } from "@/lib/site";

const titles = { ro: "Ultimele articole", ru: "Последние статьи", en: "Latest articles" };
const empty = { ro: "Nu există articole publicate încă.", ru: "Опубликованных статей пока нет.", en: "There are no published articles yet." };

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const language = locale === "ru" || locale === "en" ? locale : "ro";
  return {
    title: titles[language],
    openGraph: { title: titles[language], url: localizedAlternates(language, "/blog").canonical },
    twitter: { title: titles[language] },
    alternates: localizedAlternates(language, "/blog"),
  };
}

export default async function BlogPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string }> }) {
  const { locale } = await params;
  const query = await searchParams;
  const language = locale === "ru" || locale === "en" ? locale : "ro";
  const page = Math.max(1, Number(query.page) || 1);
  const posts = await getPaginatedBlogPosts(language, page);

  return (
    <div className="py-[70px]">
      <h1 className="mb-10 text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f]">{titles[language]}</h1>
      {posts.items.length === 0 ? (
        <p className="text-[#536070]">{empty[language]}</p>
      ) : (
        <BlogList initialPosts={posts.items} initialPage={posts.page} initialTotalPages={posts.totalPages} locale={language} />
      )}
    </div>
  );
}
