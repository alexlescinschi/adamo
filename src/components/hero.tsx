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
          ? "inline-flex items-center justify-center min-h-[44px] gap-[10px] px-4 rounded-[7px] border border-[#5ba52f] bg-gradient-to-b from-[#78bb45] to-[#55a02d] text-[12px] font-extrabold uppercase text-white shadow-[0_14px_24px_rgba(85,160,45,0.24)] xs:text-[12.5px] xs:min-h-[46px] xs:px-[17px] lg:min-h-[48px] lg:text-[14px] lg:px-6"
          : "inline-flex items-center justify-center min-h-[44px] gap-[10px] px-4 rounded-[7px] border border-[#e4e8e4] text-[12px] font-extrabold uppercase text-[#273142] bg-white/86 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.75)] xs:text-[12.5px] xs:min-h-[46px] xs:px-[17px] lg:min-h-[48px] lg:text-[14px] lg:px-6"
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
    <section className="relative flex min-h-[364px] items-center overflow-hidden xs:min-h-[374px] sm:min-h-[392px] md:min-h-[430px] lg:min-h-[400px]">
      {bgImage && (
        <Image
          src={bgImage}
          alt=""
          fill
          className="object-cover object-left sm:object-center"
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

      <div className="relative z-10 py-[22px] px-[14px] sm:pt-[30px]">
        <div className="max-w-[500px]">
          <h1 className="mb-[10px] text-[28px] font-extrabold leading-[1.08] text-[#1d1d1f] sm:text-[32px] sm:[text-shadow:0_2px_18px_rgba(255,255,255,0.9)] lg:mb-[14px] lg:text-[45px] lg:leading-[1.06] lg:[text-shadow:none] xs:text-[30px]">
            {titleLines.map((line, i) => {
              if (emphasizeWord && line.includes(emphasizeWord)) {
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
            <p className="mt-0 mb-0 max-w-[336px] text-[14.4px] leading-[1.42] text-[#3f4958] sm:text-[15.8px] sm:leading-[1.46] sm:[text-shadow:0_2px_16px_rgba(255,255,255,0.92)] lg:mb-[18px] lg:max-w-[430px] lg:text-[18px] lg:leading-[1.55] lg:text-[#4b5565] lg:[text-shadow:none] xs:text-[15px] xs:leading-[1.42]">
              {subtitle}
            </p>
          )}

          {(primaryCta?.label || ghostCta?.label) && (
            <div className="mt-0 flex flex-wrap gap-[10px] sm:mt-[14px] lg:mt-6 lg:gap-[18px]">
              {primaryCta && <CtaLink cta={primaryCta} variant="primary" />}
              {ghostCta && <CtaLink cta={ghostCta} variant="ghost" />}
            </div>
          )}

          {socialProof?.text && (
            <div className="mt-[14px] flex items-center gap-[10px] text-[12px] sm:mt-[16px] sm:text-[12.5px] lg:mt-[22px] lg:gap-[14px] lg:text-[14px]">
              <div className="w-[96px] h-[36px] flex-shrink-0 sm:w-[112px] sm:h-[42px]">
                <Image src="/social-faces.png" alt="Clienți ADAMO.MD" width={112} height={42} className="object-contain w-full h-full" />
              </div>
              <div>
                <span className="text-inherit text-[#697586] lg:[text-shadow:none]">{socialProof.text}</span>
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
