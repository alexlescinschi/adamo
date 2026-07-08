"use client";

import Script from "next/script";

// ponytail: încarcă iutepay.js + rulează iute.configure(publicKey, lang).
// Toate config-urile vin din CRM (/ecommerce/checkout/iute/config).
// Zero env vars — layout.tsx (server) face fetch, trimite ca props.
export function IuteScript({
  publicKey,
  lang,
  scriptUrl,
  styleUrl,
  enabled,
}: {
  publicKey?: string;
  lang?: string;
  scriptUrl?: string;
  styleUrl?: string;
  enabled?: boolean;
}) {
  if (!enabled || !publicKey || !scriptUrl) return null;

  return (
    <>
      {styleUrl && <link rel="stylesheet" href={styleUrl} />}
      <Script
        id="iutepay-js"
        src={scriptUrl}
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== "undefined" && window.iute) {
            window.iute.configure(publicKey, lang || "ro");
          }
        }}
      />
    </>
  );
}

declare global {
  interface Window {
    iute?: {
      configure: (publicKey: string, lang: string) => void;
      render?: (el: HTMLElement) => void;
      checkout?: (
        payload: Record<string, unknown>,
        callbacks?: {
          onSuccess?: (result: { checkoutSessionId?: string }) => void;
          onFailure?: (result: { message?: string }) => void;
        }
      ) => void;
    };
  }
}
