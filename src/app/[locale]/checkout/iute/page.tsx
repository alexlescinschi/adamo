"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Headphones } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

// ponytail: pagină return după redirect IutePay (browser).
// Query: ?status=success|cancelled&orderId=123
// CRM gestionează IutePay intern — ADAMO doar arată rezultatul.
function IuteReturnContent() {
  const params = useSearchParams();
  const routeParams = useParams();
  const locale = (routeParams?.locale as string) || "ro";
  const tr = useTranslations();
  const status = params.get("status") || "success";
  const orderId = params.get("orderId") || "";

  const isCancelled = status === "cancelled";

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      {isCancelled ? (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fdecec]">
            <XCircle className="h-8 w-8 text-[#b64400]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1d1d1f]">
            {tr.iuteReturn.cancelledTitle}
          </h1>
          <p className="mt-2 text-[#6b6c6c]">
            {tr.iuteReturn.cancelledBody.replace("{id}", orderId)}
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href={`/${locale}/cart`}
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-3 font-semibold text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all"
            >
              {tr.iuteReturn.tryAnotherPayment}
            </Link>
            <Link
              href={`/${locale}/account/orders`}
              className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#e4e8e4] bg-white px-6 py-3 font-semibold text-[#34781f] hover:bg-[#edf7e8] transition-colors"
            >
              {tr.orders.viewMine}
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf7e8]">
            <CheckCircle className="h-8 w-8 text-[#34781f]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1d1d1f]">
            {tr.iuteReturn.successTitle}
          </h1>
          <p className="mt-2 text-[#6b6c6c]">
            {tr.iuteReturn.successBody.replace("{id}", orderId)}
          </p>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href={`/${locale}/account/orders?success=true&orderId=${orderId}`}
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-3 font-semibold text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all"
            >
              {tr.orders.viewOrder}
            </Link>
          </div>

          <div className="mt-8 rounded-[12px] border border-[#e4e8e4] bg-[#f7f9f7] p-4 text-left">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1d1d1f]">
              <Headphones className="h-4 w-4 text-[#63ad36]" />
              {tr.iuteReturn.supportTitle}
            </div>
            <p className="mt-1 text-[12px] text-[#6b6c6c]">
              {tr.iuteReturn.supportBody}
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
