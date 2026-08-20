"use client";

import { useTranslations } from "@/hooks/use-translations";
import { formatPrice } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface Props {
  price: number;
  plans?: { months: number; monthlyPayment: number; kind: "smart" | "flexi" }[];
}

export function RateCalculator({ price, plans }: Props) {
  const { rates: tr } = useTranslations();

  if (!price || !plans?.length) return null;

  return (
    <details className="group mt-5 overflow-hidden rounded-[12px] border border-[#e1e7df] bg-white">
      <summary data-testid="rate-toggle" className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-[14px] font-bold text-[#1d1d1f] [&::-webkit-details-marker]:hidden">
        {tr.estimatesTitle}
        <ChevronDown className="h-5 w-5 text-[#66758a] transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-[#e1e7df] px-4 pb-4 pt-3">
        <div data-testid="rate-clouds" className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.months}
              data-months={plan.months}
              data-rate={plan.kind}
              className="grid min-w-0 grid-cols-[auto_1px_minmax(0,1fr)_auto] items-center gap-2 rounded-full border border-[#e1e7df] bg-[#f8faf8] px-3.5 py-3"
            >
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#66758a]">
                {tr.monthCount.replace("{count}", String(plan.months))}
              </span>
              <span className="h-6 w-px shrink-0 bg-[#dce3dc]" />
              <span data-testid="rate-amount" className="min-w-0 truncate whitespace-nowrap text-[14px] font-extrabold text-[#1d1d1f]">
                {formatPrice(plan.monthlyPayment)} {tr.currency}
              </span>
              <span className={`shrink-0 rounded-[10px] px-2 py-1 text-[12px] font-black ${plan.kind === "smart" ? "bg-[#dff6d6] text-[#34781f]" : "bg-[#cfe9c4] text-[#2e7d22]"}`}>
                {plan.kind === "smart" ? "0%" : "Flexi"}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#6b6c6c]">{tr.disclaimer}</p>
      </div>
    </details>
  );
}
