"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import type { BlogPostCard } from "@/lib/sanity";

const labels = {
  ro: { showMore: "Arată mai multe", loading: "Se încarcă...", error: "Articolele nu au putut fi încărcate. Încearcă din nou." },
  ru: { showMore: "Показать больше", loading: "Загрузка...", error: "Не удалось загрузить статьи. Попробуйте ещё раз." },
  en: { showMore: "Show more", loading: "Loading...", error: "The articles could not be loaded. Please try again." },
};

interface BlogListProps {
  initialPosts: BlogPostCard[];
  initialPage: number;
  initialTotalPages: number;
  locale: "ro" | "ru" | "en";
}

export function BlogList({ initialPosts, initialPage, initialTotalPages, locale }: BlogListProps) {
  const [additionalPosts, setAdditionalPosts] = useState<BlogPostCard[]>([]);
  const [loadedPage, setLoadedPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const posts = [...initialPosts, ...additionalPosts];
  const canLoadMore = loadedPage < totalPages;
  const nextPage = loadedPage + 1;

  async function loadMore(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (loading || !canLoadMore) return;

    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/blog?locale=${locale}&page=${nextPage}`);
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.items) || data.items.length === 0) throw new Error("Could not load blog posts");

      setAdditionalPosts((current) => {
        const slugs = new Set([...initialPosts, ...current].map((post) => post.slug));
        const unique = data.items.filter((post: BlogPostCard) => {
          if (slugs.has(post.slug)) return false;
          slugs.add(post.slug);
          return true;
        });
        return [...current, ...unique];
      });
      setLoadedPage(nextPage);
      setTotalPages(data.totalPages || totalPages);
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(nextPage));
      window.history.replaceState(window.history.state, "", url);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div data-testid="blog-grid" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article key={post.slug} data-testid="blog-card" className="overflow-hidden rounded-[14px] border border-[#e1e7ef] bg-white transition-colors hover:border-[#b9dca5] md:rounded-[28px]">
            <Link href={`/${locale}/blog/${post.slug}`} className="flex h-full flex-col">
              <div className="relative aspect-video overflow-hidden bg-[#f3f6f6]">
                <Image
                  src={post.imageUrl || "/og-image.png"}
                  alt={post.imageAlt || "ADAMO.MD"}
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <time className="text-xs text-[#697586]">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(post.publishedAt))}</time>
                <h2 className="mt-2 line-clamp-2 text-xl font-bold leading-tight text-[#1d1d1f]">{post.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#536070]">{post.excerpt}</p>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {canLoadMore && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <Link
            data-testid="blog-load-more"
            href={`/${locale}/blog?page=${nextPage}`}
            prefetch={false}
            onClick={loadMore}
            aria-disabled={loading || undefined}
            className={`rounded-[28px] border-2 border-[#63ad36] bg-white px-7 py-3 text-[14px] font-semibold text-[#34781f] transition-colors hover:bg-[#edf7e8] ${loading ? "pointer-events-none opacity-50" : ""}`}
          >
            {loading ? labels[locale].loading : labels[locale].showMore}
          </Link>
          {error && <p role="alert" className="text-sm text-red-600">{labels[locale].error}</p>}
        </div>
      )}
    </>
  );
}
