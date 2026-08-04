"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle, Loader2, X } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export function SpecialOrderModal({ open, onClose, locale }: { open: boolean; onClose: () => void; locale: string }) {
  const tr = useTranslations();
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", close);
    };
  }, [onClose, open]);

  if (!open) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(false);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.get("first_name"),
          last_name: form.get("last_name"),
          phone: form.get("phone"),
          email: form.get("email"),
          comment: `Comandă specială: ${form.get("details")}`,
        }),
      });
      if (!response.ok) throw new Error();
      setSuccess(true);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={tr.specialOrder.title} onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-6">
      <div onClick={(event) => event.stopPropagation()} className="relative grid max-h-[calc(100dvh-24px)] w-full max-w-4xl overflow-y-auto rounded-[20px] bg-white shadow-[0_28px_80px_rgba(0,0,0,.28)] md:grid-cols-[.85fr_1.15fr]">
        <button type="button" onClick={onClose} aria-label={tr.specialOrder.close} className="absolute right-3 top-3 z-20 rounded-full bg-white/90 p-2 text-[#1d1d1f] shadow-sm transition-colors hover:bg-white">
          <X className="h-5 w-5" />
        </button>

        <div className="relative min-h-[190px] overflow-hidden bg-[#111827] md:min-h-[620px]">
          <Image src="/special-order.jpg" alt={tr.specialOrder.imageAlt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
          <p className="absolute bottom-5 left-5 right-5 text-[18px] font-bold leading-snug text-white md:text-[22px]">{tr.specialOrder.description}</p>
        </div>

        <div className="p-5 sm:p-8 md:p-10">
          {success ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
              <CheckCircle className="mb-4 h-14 w-14 text-[#63ad36]" />
              <h2 className="text-2xl font-bold text-[#1d1d1f]">{tr.specialOrder.title}</h2>
              <p className="mt-3 max-w-sm text-[#536070]">{tr.specialOrder.success}</p>
              <button type="button" onClick={onClose} className="mt-6 rounded-full bg-[#63ad36] px-6 py-3 font-semibold text-white">{tr.specialOrder.close}</button>
            </div>
          ) : (
            <>
              <h2 className="pr-10 text-[28px] font-extrabold leading-tight text-[#1d1d1f]">{tr.specialOrder.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#536070]">{tr.specialOrder.description}</p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-medium text-[#1d1d1f]">
                    {tr.specialOrder.firstName}
                    <input name="first_name" required maxLength={100} autoComplete="given-name" className="rounded-[10px] border border-[#ccd3dc] px-3.5 py-2.5 outline-none focus:border-[#63ad36]" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium text-[#1d1d1f]">
                    {tr.specialOrder.lastName}
                    <input name="last_name" required maxLength={100} autoComplete="family-name" className="rounded-[10px] border border-[#ccd3dc] px-3.5 py-2.5 outline-none focus:border-[#63ad36]" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-medium text-[#1d1d1f]">
                    {tr.specialOrder.phone}
                    <input name="phone" type="tel" required minLength={8} maxLength={20} autoComplete="tel" className="rounded-[10px] border border-[#ccd3dc] px-3.5 py-2.5 outline-none focus:border-[#63ad36]" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium text-[#1d1d1f]">
                    {tr.specialOrder.email}
                    <input name="email" type="email" maxLength={254} autoComplete="email" className="rounded-[10px] border border-[#ccd3dc] px-3.5 py-2.5 outline-none focus:border-[#63ad36]" />
                  </label>
                </div>
                <label className="grid gap-1.5 text-sm font-medium text-[#1d1d1f]">
                  {tr.specialOrder.details}
                  <textarea name="details" required maxLength={950} rows={4} placeholder={tr.specialOrder.detailsPlaceholder} className="resize-none rounded-[10px] border border-[#ccd3dc] px-3.5 py-2.5 outline-none placeholder:text-[#9aa3af] focus:border-[#63ad36]" />
                </label>
                <label className="flex items-start gap-2 text-xs leading-relaxed text-[#536070]">
                  <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#63ad36]" />
                  <Link href={`/${locale}/politica-de-confidentialitate`} target="_blank" className="underline hover:text-[#34781f]">{tr.specialOrder.consent}</Link>
                </label>
                {error && <p role="alert" className="text-sm text-red-600">{tr.specialOrder.error}</p>}
                <button type="submit" disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-[11px] bg-gradient-to-r from-[#78bb45] to-[#55a02d] px-5 py-3.5 text-[15px] font-bold text-white transition-opacity disabled:opacity-60">
                  {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {sending ? tr.specialOrder.sending : tr.specialOrder.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
