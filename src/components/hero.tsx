import Image from "next/image";
import { ArrowRight, MessageCircle } from "lucide-react";

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
  images: string[];
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
          ? "inline-flex items-center justify-center min-h-[48px] gap-[10px] px-6 rounded-[7px] border border-[#5ba52f] bg-gradient-to-b from-[#78bb45] to-[#55a02d] text-[14px] font-extrabold uppercase text-white shadow-[0_14px_24px_rgba(85,160,45,0.24)]"
          : "inline-flex items-center justify-center min-h-[48px] gap-[10px] px-6 rounded-[7px] border border-[#e4e8e4] text-[14px] font-extrabold uppercase text-[#273142] bg-white/86 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.75)]"
      }
    >
      {cta.label}
      {variant === "ghost" && <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2.1} />}
      {variant === "primary" && <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.1} />}
    </a>
  );
}

export function Hero({ content, images }: HeroProps) {
  const { titleLines, emphasizeWord, subtitle, primaryCta, ghostCta, socialProof } = content;

  if (!titleLines || titleLines.length === 0) return null;

  const bgImage = images[0] || null;

  return (
    <section className="relative flex min-h-[420px] items-center overflow-hidden rounded-[9px] md:min-h-[540px]">
      {bgImage && (
        <Image
          src={bgImage}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      )}
      {!bgImage && <div className="absolute inset-0 bg-[#f8fbff]" />}

      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(248,251,255,.82) 0%, rgba(248,251,255,0) 5%, rgba(248,251,255,0) 96%, rgba(248,251,255,.78) 100%), linear-gradient(180deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,0) 17%, rgba(255,255,255,0) 84%, rgba(255,255,255,.58) 100%)",
        }}
      />

      <div className="relative z-10 px-4 py-12 md:px-8 md:py-16">
        <div className="max-w-[500px]">
          <h1 className="text-[32px] font-extrabold leading-[1.06] text-[#1d1d1f] md:text-[45px]">
            {titleLines.map((line, i) => {
              if (emphasizeWord && i === titleLines.length - 1 && line.includes(emphasizeWord)) {
                const parts = line.split(emphasizeWord);
                return (
                  <span key={i} className="block whitespace-nowrap">
                    {parts[0]}
                    <em className="not-italic text-[#1769e8]">{emphasizeWord}</em>
                    {parts[1]}
                  </span>
                );
              }
              return (
                <span key={i} className="block whitespace-nowrap">
                  {line}
                </span>
              );
            })}
          </h1>

          {subtitle && (
            <p className="mt-4 max-w-[430px] text-[18px] leading-[1.55] text-[#4b5565]">
              {subtitle}
            </p>
          )}

          {(primaryCta?.label || ghostCta?.label) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {primaryCta && <CtaLink cta={primaryCta} variant="primary" />}
              {ghostCta && <CtaLink cta={ghostCta} variant="ghost" />}
            </div>
          )}

          {socialProof?.text && (
            <div className="mt-[22px] flex items-center gap-[14px]">
              <div className="w-[112px] h-[42px] flex-shrink-0">
                <Image src="/social-faces.png" alt="Clienți ADAMO.MD" width={112} height={42} className="object-contain" />
              </div>
              <div>
                <span className="text-[14px] text-[#697586]">{socialProof.text}</span>
                {socialProof.stars > 0 && (
                  <b className="block text-[#63ad36] tracking-[3px] mt-1">
                    {"★★★★★".slice(0, socialProof.stars)}
                  </b>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
