"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  price: number;
  sku: string;
  pageType?: "product" | "category";
}

export function IuteCalculator({ price, sku, pageType = "product" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasSdk, setHasSdk] = useState(false);

  useEffect(() => {
    if (!price) return;

    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (window.iute || tries > 20) {
        setHasSdk(Boolean(window.iute));
        clearInterval(timer);
      }
    }, 250);

    return () => clearInterval(timer);
  }, [price]);

  if (!price || !hasSdk) return null;

  return (
    <div
      ref={ref}
      className="iute-as-low-as mt-2"
      data-amount={price}
      data-page-type={pageType}
      data-sku={sku}
      data-learnmore-show="true"
    />
  );
}
