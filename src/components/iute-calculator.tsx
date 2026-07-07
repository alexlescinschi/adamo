"use client";

import { useEffect, useRef, useState } from "react";

// ponytail: wrapper pt tag-ul iute-as-low-as (iutepay.js).
// După ce iute.configure() rulează, SDK populează automat acest div cu widgetul
// "X MDL/lună". Dacă SDK nu e încărcat (chei lipsă), nu randează nimic.

interface Props {
  price: number;
  sku: string;
  pageType?: "product" | "category";
}

declare global {
  interface Window {
    iute?: {
      configure: (publicKey: string, country: string) => void;
      render?: (el: HTMLElement) => void;
    };
  }
}

export function IuteCalculator({ price, sku, pageType = "product" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasSdk, setHasSdk] = useState(false);

  useEffect(() => {
    if (!price) return;

    // ponytail: iute.configure() rulează în layout onLoad. Așteptăm SDK (poll scurt).
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if (window.iute || tries > 20) {
        setHasSdk(Boolean(window.iute));
        clearInterval(t);
      }
    }, 250);

    return () => clearInterval(t);
  }, [price]);

  if (!price || !hasSdk) return null;

  return (
    <div
      ref={ref}
      className="iute-as-low-as mt-2"
      // ponytail: docs — data-amount = valoare în monedă (ex 1200), NU minor unit.
      data-amount={price}
      data-page-type={pageType}
      data-sku={sku}
      data-learnmore-show="true"
    />
  );
}
