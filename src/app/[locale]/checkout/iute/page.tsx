"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Headphones } from "lucide-react";

// ponytail: pagină return după redirect IutePay (browser).
// Query: ?status=success|cancelled&orderId=123
// useSearchParams cere Suspense boundary în Next 16 → componentă inner separată.
function IuteReturnContent() {
  const params = useSearchParams();
  const status = params.get("status") || "success";
  const orderId = params.get("orderId") || "";

  const [liveStatus, setLiveStatus] = useState<string>("");
  // Inițializat cu false dacă orderId lipsește — fără setState în effect.
  const [checking, setChecking] = useState(Boolean(orderId));

  // ponytail: poll status live (webhook poate întârzia). 1 încercare + retry la 4s.
  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/payments/iute/status?orderId=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setLiveStatus(data.status || "");
        }
      } catch {
        /* webhook va marca oricum */
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    poll();
    const t = setTimeout(poll, 4000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [orderId]);

  const isCancelled = status === "cancelled";

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      {isCancelled ? (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fdecec]">
            <XCircle className="h-8 w-8 text-[#b64400]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1d1d1f]">
            Aplicația a fost anulată
          </h1>
          <p className="mt-2 text-[#6b6c6c]">
            Ai închis fereastra IutePay înainte de semnare. Comanda #{orderId}{" "}
            rămâne în așteptare — poți încerca o altă metodă de plată.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/cart"
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-3 font-semibold text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all"
            >
              Încearcă altă plată
            </Link>
            <Link
              href="/account/orders"
              className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#e4e8e4] bg-white px-6 py-3 font-semibold text-[#34781f] hover:bg-[#edf7e8] transition-colors"
            >
              Vezi comenzile mele
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf7e8]">
            <CheckCircle className="h-8 w-8 text-[#34781f]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1d1d1f]">
            Aplicația a fost trimisă către IuteCredit!
          </h1>
          <p className="mt-2 text-[#6b6c6c]">
            Comanda #{orderId} e înregistrată. IuteCredit procesează aplicația
            ta de credit (verificare IDN, scor). Vei primi confirmarea pe phone
            și email.
          </p>

          {/* Status live */}
          <div className="mt-5 inline-flex items-center gap-2 rounded-[10px] border border-[#e4e8e4] bg-white px-4 py-2 text-[13px]">
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#63ad36]" />
                <span className="text-[#6b6c6c]">Verific status aplicație…</span>
              </>
            ) : (
              <span className="text-[#34781f]">
                Status IuteCredit: <strong>{liveStatus || "procesare"}</strong>
              </span>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href={`/account/orders?success=true&orderId=${orderId}`}
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-3 font-semibold text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all"
            >
              Vezi comanda mea
            </Link>
          </div>

          <div className="mt-8 rounded-[12px] border border-[#e4e8e4] bg-[#f7f9f7] p-4 text-left">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1d1d1f]">
              <Headphones className="h-4 w-4 text-[#63ad36]" />
              Întrebări despre credit?
            </div>
            <p className="mt-1 text-[12px] text-[#6b6c6c]">
              Sună IuteCredit la <strong>022 800 800</strong> sau Adamo la{" "}
              <strong>+373 799 66 909</strong>.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default function IuteReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#63ad36]" />
        </div>
      }
    >
      <IuteReturnContent />
    </Suspense>
  );
}
