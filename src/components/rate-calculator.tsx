"use client";

import { useState } from "react";
import { X, Building2, ChevronRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const PLANS = [
  { months: 6,  rate: 0 },
  { months: 8,  rate: 0 },
  { months: 10, rate: 1 },
  { months: 12, rate: 1 },
  { months: 18, rate: 1 },
  { months: 24, rate: 1 },
  { months: 36, rate: 1 },
];

function monthly(price: number, months: number, rate: number): number {
  if (rate === 0) return Math.ceil(price / months);
  const r = rate / 100;
  const factor = Math.pow(1 + r, months);
  return Math.ceil((price * r * factor) / (factor - 1));
}

function fmt(n: number) {
  return n.toLocaleString("ro-MD");
}

interface Props {
  price: number;
  productName: string;
}

export function RateCalculator({ price, productName }: Props) {
  const tr = useTranslations();
  const [selectedMonths, setSelectedMonths] = useState(8);
  const [open, setOpen] = useState(false);
  const [withAdvance, setWithAdvance] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [sent, setSent] = useState(false);

  if (!price) return null;

  const best = PLANS.find((p) => p.months === selectedMonths) || PLANS[1];
  const amount = monthly(price, best.months, best.rate);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          comment: `Rate ADAMO: ${productName} — ${best.months} luni, ${fmt(amount)} lei/lună${withAdvance ? ", cu avans" : ""}`,
        }),
      });
    } catch {}
    setSent(true);
  }

  return (
    <>
      {/* Inline widget */}
      <div className="mt-4 rounded-[12px] border border-[#e4e8e4] bg-[#f7f9f7] p-4">
        {/* Badge + price row */}
        <div className="flex items-center justify-between mb-3">
          <span className="rounded-[6px] bg-[#63ad36] px-[10px] py-[4px] text-[11px] font-black uppercase tracking-wide text-white">
            Preț Rate ADAMO
          </span>
          <span className="text-[22px] font-extrabold text-[#1d1d1f]">{fmt(price)} <span className="text-[15px] font-semibold text-[#6b6c6c]">lei</span></span>
        </div>

        {/* Plan selector */}
        <div className="flex items-center gap-3 mb-4">
          <select
            value={selectedMonths}
            onChange={(e) => setSelectedMonths(Number(e.target.value))}
            className="rounded-[9px] border border-[#e4e8e4] bg-white px-3 py-2 text-[13px] font-semibold text-[#1d1d1f] focus:border-[#63ad36] focus:outline-none"
          >
            {PLANS.map((p) => (
              <option key={p.months} value={p.months}>
                {p.rate}% · {p.months} luni
              </option>
            ))}
          </select>
          <span className="text-[#6b6c6c] text-[13px]">→</span>
          <span className="text-[18px] font-extrabold text-[#34781f]">
            {fmt(amount)} <span className="text-[13px] font-semibold text-[#6b6c6c]">lei / lună</span>
          </span>
        </div>

        {/* CTA button */}
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#63ad36] bg-white px-5 py-3 text-[14px] font-bold text-[#34781f] transition-colors hover:bg-[#edf7e8]"
        >
          <Building2 className="h-5 w-5" />
          Cumpără în rate
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center" onClick={() => setOpen(false)}>
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-[20px] bg-white p-6 shadow-xl md:rounded-[20px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full p-1.5 text-[#6b6c6c] hover:bg-[#f3f6f6] transition-colors">
              <X className="h-5 w-5" />
            </button>

            {/* Product header */}
            <div className="mb-5 pr-8">
              <p className="text-[13px] text-[#6b6c6c]">Cumpărare în rate</p>
              <h3 className="mt-1 text-[16px] font-bold text-[#1d1d1f] leading-tight">{productName}</h3>
              <p className="mt-1 text-[22px] font-extrabold text-[#1d1d1f]">{fmt(price)} <span className="text-[14px] font-semibold text-[#6b6c6c]">lei</span></p>
            </div>

            {sent ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#edf7e8]">
                  <ChevronRight className="h-7 w-7 text-[#34781f]" />
                </div>
                <p className="text-[16px] font-bold text-[#1d1d1f]">Cererea a fost trimisă!</p>
                <p className="mt-1 text-[14px] text-[#6b6c6c]">Te vom contacta în scurt timp.</p>
                <button onClick={() => { setOpen(false); setSent(false); }} className="mt-5 rounded-[10px] bg-[#63ad36] px-6 py-2.5 text-[14px] font-bold text-white hover:bg-[#4e8f28]">
                  Închide
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Plans grid */}
                <div>
                  <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#6b6c6c]">Selectează planul</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PLANS.map((p) => {
                      const amt = monthly(price, p.months, p.rate);
                      const active = p.months === selectedMonths;
                      return (
                        <button
                          key={p.months}
                          onClick={() => setSelectedMonths(p.months)}
                          className={`relative rounded-[10px] border p-3 text-left transition-all ${
                            active
                              ? "border-[#63ad36] bg-[#edf7e8]"
                              : "border-[#e4e8e4] bg-white hover:border-[#63ad36]/50"
                          }`}
                        >
                          <span className={`absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                            p.rate === 0 ? "bg-[#edf7e8] text-[#34781f]" : "bg-[#f0f0f0] text-[#6b6c6c]"
                          }`}>
                            {p.rate}%
                          </span>
                          <p className="text-[15px] font-extrabold text-[#1d1d1f] leading-none">{fmt(amt)}</p>
                          <p className="mt-0.5 text-[11px] text-[#6b6c6c]">lei</p>
                          <p className="mt-1 text-[11px] font-semibold text-[#6b6c6c]">{p.months} plăți</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Total */}
                  <div className="mt-3 rounded-[10px] bg-[#f7f9f7] px-4 py-3">
                    <p className="text-[13px] text-[#6b6c6c]">Total lunar</p>
                    <p className="text-[20px] font-extrabold text-[#34781f]">{fmt(monthly(price, selectedMonths, best.rate))} lei</p>
                    <p className="text-[11px] text-[#6b6c6c] mt-1">* Datele sunt informative. Rata finală se stabilește la aprobare.</p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <p className="text-[13px] font-bold uppercase tracking-wide text-[#6b6c6c]">Completează formularul</p>

                  {/* With advance toggle */}
                  <label className="flex cursor-pointer items-center justify-between rounded-[10px] border border-[#e4e8e4] px-4 py-3">
                    <span className="text-[13px] font-semibold text-[#1d1d1f]">Cu avans</span>
                    <div
                      onClick={() => setWithAdvance((v) => !v)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${withAdvance ? "bg-[#63ad36]" : "bg-[#e4e8e4]"}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${withAdvance ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </label>

                  <input
                    required
                    placeholder="Prenume"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="rounded-[10px] border border-[#e4e8e4] px-4 py-3 text-[14px] text-[#1d1d1f] placeholder:text-[#a0a8a0] focus:border-[#63ad36] focus:outline-none"
                  />
                  <input
                    required
                    placeholder="Nume"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="rounded-[10px] border border-[#e4e8e4] px-4 py-3 text-[14px] text-[#1d1d1f] placeholder:text-[#a0a8a0] focus:border-[#63ad36] focus:outline-none"
                  />
                  <div className="flex overflow-hidden rounded-[10px] border border-[#e4e8e4] focus-within:border-[#63ad36]">
                    <span className="flex items-center border-r border-[#e4e8e4] bg-[#f7f9f7] px-3 text-[13px] font-semibold text-[#6b6c6c]">+373</span>
                    <input
                      required
                      placeholder="0000-0000"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="min-w-0 flex-1 bg-white px-3 py-3 text-[14px] text-[#1d1d1f] placeholder:text-[#a0a8a0] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-2 flex items-center justify-center gap-2 rounded-[12px] bg-[#63ad36] px-5 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-[#4e8f28]"
                  >
                    <Building2 className="h-5 w-5" />
                    Trimite cererea
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
