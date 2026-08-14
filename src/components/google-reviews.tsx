"use client";

import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useRef } from "react";
import { ADAMO_MAPS_URI, ADAMO_WRITE_REVIEW_URI, type GooglePlace } from "@/lib/google-places";

type Labels = {
  reviewTitle: string;
  reviewCount: string;
  writeReview: string;
  viewReview: string;
  previousReviews: string;
  nextReviews: string;
};

export function GoogleReviews({ place, labels }: { place: GooglePlace | null; labels: Labels }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    const slide = track?.querySelector<HTMLElement>("[data-review-slide]");
    if (!track || !slide) return;
    track.scrollBy({ left: direction * (slide.offsetWidth + 16), behavior: "smooth" });
  }

  const slideClass = "h-[320px] w-full flex-none snap-start md:w-[calc((100%_-_2rem)/3)]";

  return (
    <section className="mb-7" aria-labelledby="google-reviews-title">
      <h2 id="google-reviews-title" className="sr-only">{labels.reviewTitle}</h2>
      <div className="mb-3 flex justify-end gap-2">
        <button type="button" onClick={() => move(-1)} aria-label={labels.previousReviews} className="grid h-10 w-10 place-items-center rounded-full border border-[#dce3ea] bg-white text-[#253244] shadow-sm transition hover:border-[#aebac7] hover:bg-[#f7f9fb]">
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => move(1)} aria-label={labels.nextReviews} className="grid h-10 w-10 place-items-center rounded-full border border-[#dce3ea] bg-white text-[#253244] shadow-sm transition hover:border-[#aebac7] hover:bg-[#f7f9fb]">
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div ref={trackRef} data-testid="google-reviews" className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <article data-review-slide className={`${slideClass} flex flex-col items-center justify-center rounded-[12px] border border-[#e1e7ef] bg-white p-6 text-center shadow-[0_12px_30px_rgba(31,41,55,0.08)]`}>
          <a href={place?.googleMapsUri || ADAMO_MAPS_URI} target="_blank" rel="noopener noreferrer" translate="no" className="text-[18px] font-semibold text-[#4285f4]">Google Maps</a>
          <p className="mt-2 text-[25px] font-extrabold tracking-[-0.02em] text-[#172033]">ADAMO</p>
          {place && (
            <>
              <div className="mt-3 flex items-center justify-center gap-2">
                <strong data-testid="google-rating" className="text-[22px] text-[#172033]">{place.rating.toFixed(1)}</strong>
                <span className="text-[22px] tracking-[2px] text-[#fbbc04]" aria-hidden="true">★★★★★</span>
              </div>
              <p data-testid="google-review-count" className="mt-1 text-[14px] text-[#536070]">{labels.reviewCount.replace("{count}", String(place.reviewCount))}</p>
            </>
          )}
          <a href={place?.writeReviewUri || ADAMO_WRITE_REVIEW_URI} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-[8px] bg-[#111] px-5 text-[14px] font-bold text-white transition hover:bg-[#2b2b2b]">
            {labels.writeReview}
          </a>
        </article>

        {place?.reviews.map((review) => (
          <article data-review-slide key={review.id} className={`${slideClass} flex flex-col rounded-[12px] border border-[#e1e7ef] bg-white p-6 shadow-[0_12px_30px_rgba(31,41,55,0.08)]`}>
            <div className="flex items-center gap-3">
              <a href={review.authorUri} target="_blank" rel="noopener noreferrer" className="shrink-0" aria-label={review.author}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={review.authorPhotoUri} alt="" width="46" height="46" loading="lazy" referrerPolicy="no-referrer" className="h-[46px] w-[46px] rounded-full object-cover" />
              </a>
              <div className="min-w-0">
                <a href={review.authorUri} target="_blank" rel="noopener noreferrer" className="block truncate text-[16px] font-bold text-[#172033] hover:underline">{review.author}</a>
                <span className="text-[13px] text-[#697586]">{review.relativeTime}</span>
              </div>
            </div>
            <span className="mt-5 text-[20px] tracking-[2px] text-[#fbbc04]" aria-label={`${review.rating}/5`}>{"★".repeat(review.rating)}</span>
            <p className="mt-2 line-clamp-6 flex-1 whitespace-pre-line text-[15px] leading-[1.55] text-[#35445a]">{review.text}</p>
            <a href={review.googleMapsUri} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 self-start text-[13px] text-[#35445a] hover:underline">
              <span translate="no">Google Maps</span>
              <ExternalLink className="h-4 w-4 text-[#1769e0]" aria-hidden="true" />
              <span className="sr-only">{labels.viewReview}</span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
