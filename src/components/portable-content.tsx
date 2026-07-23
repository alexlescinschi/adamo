import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Image from "next/image";
import { sanityImageUrl } from "@/lib/sanity";

function safeHref(value: unknown) {
  if (typeof value !== "string") return null;
  if (value.startsWith("/") || value.startsWith("#")) return value;
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="text-[15px] leading-7 text-[#536070]">{children}</p>,
    h2: ({ children }) => <h2 className="pt-4 text-[22px] font-bold leading-tight text-[#1d1d1f]">{children}</h2>,
    h3: ({ children }) => <h3 className="pt-2 text-[17px] font-semibold leading-tight text-[#1d1d1f]">{children}</h3>,
    blockquote: ({ children }) => <blockquote className="border-l-4 border-[#63ad36] pl-4 text-[15px] italic leading-7 text-[#536070]">{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc space-y-2 pl-6 text-[15px] leading-7 text-[#536070]">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal space-y-2 pl-6 text-[15px] leading-7 text-[#536070]">{children}</ol>,
  },
  marks: {
    link: ({ children, value }) => {
      const href = safeHref(value?.href);
      if (!href) return <>{children}</>;
      const external = href.startsWith("http");
      return (
        <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="font-medium text-[#34781f] underline underline-offset-2">
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }) => {
      const src = sanityImageUrl(value);
      if (!src) return null;
      return <Image src={src} alt={value.alt || ""} width={1200} height={675} className="my-6 h-auto w-full rounded-[14px] object-cover md:rounded-[28px]" />;
    },
  },
};

export function PortableContent({ value }: { value: any[] }) {
  if (!Array.isArray(value) || value.length === 0) return null;
  return (
    <div className="space-y-4">
      <PortableText value={value} components={components} />
    </div>
  );
}
