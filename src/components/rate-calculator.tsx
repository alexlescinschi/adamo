"use client";

import { useTranslations } from "@/hooks/use-translations";
import { formatPrice } from "@/lib/utils";

const PLANS = [
  { months: 4,  rate: 0 },
  { months: 6,  rate: 0 },
  { months: 8,  rate: 1 },
  { months: 10, rate: 1 },
  { months: 12, rate: 1 },
  { months: 18, rate: 1 },
  { months: 24, rate: 1 },
  { months: 36, rate: 1 },
];

function monthly(price: number, months: number, rate: number): number {
  if (rate === 0) return Math.ceil(price / months);
  return Math.ceil((price * (1 + (months * rate) / 100)) / months);
}

interface Props {
  price: number;
}

export function RateCalculator({ price }: Props) {
  const { rates: tr } = useTranslations();

  if (!price) return null;

  return (
    <div className="mt-5">
      <p className="mb-3 text-[14px] font-bold text-[#1d1d1f]">{tr.estimatesTitle}</p>
      <div data-testid="rate-clouds" className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.months}
            data-months={plan.months}
            data-rate={plan.rate}
            className="grid min-w-0 grid-cols-[auto_1px_minmax(0,1fr)_auto] items-center gap-2 rounded-full border border-[#e1e7df] bg-[#f8faf8] px-3.5 py-3"
          >
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#66758a]">
              {tr.monthCount.replace("{count}", String(plan.months))}
            </span>
            <span className="h-6 w-px shrink-0 bg-[#dce3dc]" />
            <span data-testid="rate-amount" className="min-w-0 truncate whitespace-nowrap text-[14px] font-extrabold text-[#1d1d1f]">
              {formatPrice(monthly(price, plan.months, plan.rate))} {tr.currency}
            </span>
            <span className={`shrink-0 rounded-[10px] px-2 py-1 text-[12px] font-black ${plan.rate === 0 ? "bg-[#dff6d6] text-[#34781f]" : "bg-[#cfe9c4] text-[#2e7d22]"}`}>
              {plan.rate}%
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[#6b6c6c]">{tr.disclaimer}</p>
    </div>
  );
}
