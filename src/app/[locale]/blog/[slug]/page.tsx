import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PortableContent } from "@/components/portable-content";
import { getBlogPost, sanityImageUrl } from "@/lib/sanity";
import { localizedAlternates } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPost(slug, locale);
  if (!post) return {};
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: { title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, url: localizedAlternates(locale, `/blog/${slug}`).canonical },
    twitter: { title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt },
    alternates: localizedAlternates(locale, `/blog/${slug}`),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const post = await getBlogPost(slug, locale);
  if (!post) notFound();
  const image = sanityImageUrl(post.coverImage);

  return (
    <article className="mx-auto max-w-3xl py-[70px]">
      <time className="text-sm text-[#697586]">{new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(post.publishedAt))}</time>
      <h1 className="mb-5 mt-2 text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f]">{post.title}</h1>
      <p className="mb-8 text-lg leading-8 text-[#536070]">{post.excerpt}</p>
      {image && <Image src={image} alt={post.coverImage?.alt || ""} width={1200} height={675} priority className="mb-8 aspect-video w-full rounded-[14px] object-cover md:rounded-[28px]" />}
      <PortableContent value={post.body} />
    </article>
  );
}
