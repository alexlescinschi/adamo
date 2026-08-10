import "server-only";
import { createClient, type QueryParams } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = "2026-07-23";

const client = projectId
  ? createClient({ projectId, dataset, apiVersion, useCdn: true })
  : null;

const imageBuilder = client ? imageUrlBuilder(client) : null;

export interface ContentPage {
  title: string;
  body: any[];
  seoTitle?: string;
  seoDescription?: string;
  updatedAt: string;
}

export interface BlogPostSummary {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
  coverImage?: any;
}

export interface BlogPost extends BlogPostSummary {
  body: any[];
  seoTitle?: string;
  seoDescription?: string;
  updatedAt: string;
}

export interface BlogPostCard {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface PaginatedBlogPosts {
  items: BlogPostCard[];
  total: number;
  totalPages: number;
  page: number;
}

export const BLOG_PAGE_SIZE = 9;

export interface ContactSettings {
  phone: string;
  email: string;
  address: string;
  hours: string;
}

function languageSuffix(locale: string) {
  return locale === "ru" || locale === "en" ? locale : "ro";
}

async function fetchSanity<T>(query: string, params: QueryParams = {}): Promise<T | null> {
  if (!client) return null;
  return client.fetch<T>(query, params, { next: { revalidate: 60 } });
}

export function sanityImageUrl(source: any, width = 1200) {
  if (!imageBuilder || !source) return null;
  return imageBuilder.image(source).width(width).fit("max").auto("format").url();
}

export function getContentPage(slug: string, locale: string) {
  const lang = languageSuffix(locale);
  return fetchSanity<ContentPage>(
    `*[_type == "page" && slug.current == $slug][0]{
      "title": title_${lang},
      "body": body_${lang},
      "seoTitle": seoTitle_${lang},
      "seoDescription": seoDescription_${lang},
      "updatedAt": _updatedAt
    }`,
    { slug },
  );
}

export async function getBlogPosts(locale: string) {
  const lang = languageSuffix(locale);
  return (
    (await fetchSanity<BlogPostSummary[]>(
      `*[_type == "post" && publishedAt <= now()] | order(publishedAt desc){
        "title": title_${lang},
        "excerpt": excerpt_${lang},
        "slug": slug.current,
        publishedAt,
        coverImage
      }`,
    )) || []
  );
}

export async function getPaginatedBlogPosts(locale: string, requestedPage = 1): Promise<PaginatedBlogPosts> {
  const lang = languageSuffix(locale);
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
  const start = (page - 1) * BLOG_PAGE_SIZE;
  const end = start + BLOG_PAGE_SIZE;
  const result = await fetchSanity<{ items: BlogPostCard[]; total: number }>(
    `{
      "items": *[_type == "post" && publishedAt <= now()] | order(publishedAt desc, _id desc) [$start...$end]{
        "title": title_${lang},
        "excerpt": excerpt_${lang},
        "slug": slug.current,
        publishedAt,
        "imageUrl": coverImage.asset->url,
        "imageAlt": coverImage.alt
      },
      "total": count(*[_type == "post" && publishedAt <= now()])
    }`,
    { start, end },
  );
  const total = result?.total || 0;

  return {
    items: result?.items || [],
    total,
    totalPages: Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE)),
    page,
  };
}

export function getBlogPost(slug: string, locale: string) {
  const lang = languageSuffix(locale);
  return fetchSanity<BlogPost>(
    `*[_type == "post" && slug.current == $slug && publishedAt <= now()][0]{
      "title": title_${lang},
      "excerpt": excerpt_${lang},
      "body": body_${lang},
      "seoTitle": seoTitle_${lang},
      "seoDescription": seoDescription_${lang},
      "slug": slug.current,
      publishedAt,
      coverImage,
      "updatedAt": _updatedAt
    }`,
    { slug },
  );
}

export function getContactSettings(locale: string) {
  const lang = languageSuffix(locale);
  return fetchSanity<ContactSettings>(
    `*[_type == "contactSettings"][0]{
      phone,
      email,
      "address": address_${lang},
      "hours": hours_${lang}
    }`,
  );
}

export async function getPublishedContentSlugs() {
  return (
    (await fetchSanity<{ pages: { slug: string; updatedAt: string }[]; posts: { slug: string; updatedAt: string }[] }>(
      `{
        "pages": *[_type == "page"]{"slug": slug.current, "updatedAt": _updatedAt},
        "posts": *[_type == "post" && publishedAt <= now()]{"slug": slug.current, "updatedAt": _updatedAt}
      }`,
    )) || { pages: [], posts: [] }
  );
}
