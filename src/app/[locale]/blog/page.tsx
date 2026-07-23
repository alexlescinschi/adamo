import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogPosts, sanityImageUrl } from "@/lib/sanity";
import { localizedAlternates } from "@/lib/site";

const titles = { ro: "Blog", ru: "Блог", en: "Blog" };
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

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const language = locale === "ru" || locale === "en" ? locale : "ro";
  const posts = await getBlogPosts(language);

  return (
    <div className="py-[70px]">
      <h1 className="mb-10 text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f]">{titles[language]}</h1>
      {posts.length === 0 ? (
        <p className="text-[#536070]">{empty[language]}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const image = sanityImageUrl(post.coverImage, 800);
            return (
              <article key={post.slug} className="overflow-hidden rounded-[14px] border border-[#e1e7ef] bg-white md:rounded-[28px]">
                {image && <Image src={image} alt={post.coverImage?.alt || ""} width={800} height={450} className="aspect-video w-full object-cover" />}
                <div className="p-5">
                  <time className="text-xs text-[#697586]">{new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(new Date(post.publishedAt))}</time>
                  <h2 className="mt-2 text-xl font-bold text-[#1d1d1f]">
                    <Link href={`/${language}/blog/${post.slug}`} className="hover:text-[#34781f]">{post.title}</Link>
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#536070]">{post.excerpt}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
