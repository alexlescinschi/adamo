import Image from "next/image";
import { ArrowRight, MessageCircle, Star } from "lucide-react";

export interface HeroContent {
  titleLines: string[];
  emphasizeWord?: string;
  subtitle?: string;
  primaryCta?: { label: string; href: string };
  ghostCta?: { label: string; href: string };
  socialProof?: { text: string; stars: number };
}

interface HeroProps {
  content: HeroContent;
  imageUrl: string | null;
}

const isExternal = (href: string) => href.startsWith("http");

function CtaLink({ cta, variant }: { cta: { label: string; href: string }; variant: "primary" | "ghost" }) {
  if (!cta.label || !cta.href) return null;
  const external = isExternal(cta.href);
  return (
    <a
      href={cta.href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={
        variant === "primary"
          ? "inline-flex items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(99,173,54,0.3)] transition-all hover:from-[#63ad36] hover:to-[#4e8f28]"
          : "inline-flex items-center justify-center gap-2 rounded-[12px] border border-[#e4e8e4] bg-white px-6 py-3 text-[15px] font-semibold text-[#1d1d1f] transition-colors hover:border-[#63ad36] hover:text-[#34781f]"
      }
    >
      {variant === "ghost" && <MessageCircle className="h-4 w-4" />}
      {cta.label}
      {variant === "primary" && <ArrowRight className="h-4 w-4" />}
    </a>
  );
}

export function Hero({ content, imageUrl }: HeroProps) {
  const { titleLines, emphasizeWord, subtitle, primaryCta, ghostCta, socialProof } = content;

  // Graceful: no title -> render nothing.
  if (!titleLines || titleLines.length === 0) return null;

  return (
    <section className="grid items-center gap-8 py-8 md:grid-cols-2 md:gap-12 md:py-12">
      {/* Left: copy */}
      <div className="order-2 md:order-1">
        <h1 className="text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#1d1d1f] md:text-[44px]">
          {titleLines.map((line, i) => {
            // Emphasize the configured word inside the last line (like the template's <em>).
            if (emphasizeWord && i === titleLines.length - 1 && line.includes(emphasizeWord)) {
              const parts = line.split(emphasizeWord);
              return (
                <span key={i} className="block">
                  {parts[0]}
                  <em className="not-italic text-[#34781f]">{emphasizeWord}</em>
                  {parts[1]}
                </span>
              );
            }
            return (
              <span key={i} className="block">
                {line}
              </span>
            );
          })}
        </h1>

        {subtitle && <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#6b6c6c] md:text-[16px]">{subtitle}</p>}

        {(primaryCta?.label || ghostCta?.label) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {primaryCta && <CtaLink cta={primaryCta} variant="primary" />}
            {ghostCta && <CtaLink cta={ghostCta} variant="ghost" />}
          </div>
        )}

        {socialProof?.text && (
          <div className="mt-8 flex items-center gap-3">
            {/* Stacked avatar faces */}
            <div className="flex">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#7cc44e] to-[#63ad36] text-[11px] font-bold text-white shadow-sm"
                  style={{ marginLeft: i === 0 ? 0 : -10 }}
                />
              ))}
            </div>
            <div className="grid leading-[1.2]">
              <span className="text-[13px] font-medium text-[#1d1d1f]">{socialProof.text}</span>
              {socialProof.stars > 0 && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: socialProof.stars }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[#f5a623] text-[#f5a623]" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: visual */}
      {imageUrl && (
        <div className="order-1 md:order-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-[#f3f6f6] md:aspect-square">
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-contain p-6"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      )}
    </section>
  );
}
