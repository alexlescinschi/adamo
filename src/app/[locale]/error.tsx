"use client";

// ponytail: un singur error boundary la nivel de [locale] → acoperă
// category / laptopuri / minipc / product / search / cont. Nu lasă ecran alb pe 500 de la CRM.
import { useEffect } from "react";

export default function LocaleError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl mb-4">😐</p>
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#1d1d1f] mb-2">
        Ceva n-a mers bine
      </h1>
      <p className="text-[#6b6c6c] max-w-md mb-6">
        Nu am putut încărca această pagină. Încearcă din nou — dacă problema
        persistă, revino în câteva minute.
      </p>
      <button
        onClick={unstable_retry}
        className="rounded-full bg-[#1d1d1f] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#000]"
      >
        Reîncearcă
      </button>
    </div>
  );
}
