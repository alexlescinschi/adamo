"use client";

import Script from "next/script";

// ponytail: încarcă iutepay.js + rulează iute.configure(public_key, lang).
// Trebuie client component pt onLoad handler (server components nu pot pasa funcții).
// Public key doar în browser — admin key niciodată aici.
export function IuteScript({
  publicKey,
  lang,
  scriptUrl,
  styleUrl,
  enabled,
}: {
  publicKey: string;
  lang: string;
  scriptUrl: string;
  styleUrl: string;
  enabled: boolean;
}) {
  if (!enabled) return null;

  return (
    <>
      <link rel="stylesheet" href={styleUrl} />
      <Script
        id="iutepay-js"
        src={scriptUrl}
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== "undefined" && window.iute) {
            window.iute.configure(publicKey, lang);
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
    };
  }
}
