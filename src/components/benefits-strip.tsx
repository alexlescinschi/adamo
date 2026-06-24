"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";

interface Benefit {
  Icon: LucideIcon;
  title: string;
  sub: string;
  desc: string;
}

export function BenefitsStrip({ benefits }: { benefits: Benefit[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleClick = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const active = activeIndex !== null ? benefits[activeIndex] : null;

  return (
    <>
      <div className="mx-auto grid grid-cols-2 border border-[#e1e7ef] rounded-[9px] bg-white/90 shadow-[0_18px_45px_rgba(31,41,55,0.08)] overflow-hidden md:grid-cols-3 lg:grid-cols-6">
        {benefits.map((item, i) => {
          const isActive = activeIndex === i;
          return (
            <button
              key={item.title}
              type="button"
              aria-expanded={isActive}
              onClick={() => handleClick(i)}
              className={`flex items-center gap-[9px] min-h-[76px] py-[10px] px-3 border-r border-[#e1e7ef] text-left cursor-pointer transition-[background,color] duration-[.18s] outline-none ${
                i === benefits.length - 1 ? "border-r-0" : ""
              } ${
                isActive
                  ? "bg-[#f9fdf6]/50 shadow-[inset_0_2px_0_rgba(83,168,45,0.55)]"
                  : "bg-transparent hover:bg-[#f9fdf6]/50"
              }`}
            >
              <span className={`flex-shrink-0 grid place-items-center w-9 h-9 transition-colors duration-[.18s] ${
                isActive ? "text-[#2f7d25]" : "text-[#111827]"
              }`}>
                <item.Icon className="h-8 w-8" strokeWidth={2} />
              </span>
              <span className="min-w-0 grid leading-[1.2]">
                <b className={`text-[11px] font-extrabold uppercase transition-colors duration-[.18s] ${
                  isActive ? "text-[#2f7d25]" : "text-[#1d1d1f]"
                }`}>{item.title}</b>
                <span className={`text-[12px] whitespace-nowrap transition-colors duration-[.18s] ${
                  isActive ? "text-[#2f7d25]" : "text-[#6b6c6c]"
                }`}>{item.sub}</span>
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <div className="flex items-center gap-3 mt-[10px] py-3 px-4 border border-[#e1e7ef] rounded-[9px] bg-white/90 shadow-[0_12px_30px_rgba(31,41,55,0.06)] text-[13px] leading-[1.45] text-[#536070]">
          <b className="flex-shrink-0 text-[12px] uppercase text-[#1d1d1f]">{active.title}</b>
          <span>{active.desc}</span>
        </div>
      )}
    </>
  );
}
