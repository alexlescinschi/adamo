"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function LoginPage() {
  const router = useRouter();
  const tr = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const [phoneStep, setPhoneStep] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [googleName, setGoogleName] = useState("");
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return;

    const initGoogle = () => {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        shape: "pill",
        theme: "outline",
        size: "large",
        text: "signin_with",
        width: 320,
      });
    };

    // ponytail: script already loaded from previous SPA navigation → re-init directly
    if ((window as any).google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);
  }, []);

  const handleGoogleCredential = async (response: any) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Autentificare Google eșuată");
      if (data.needsPhone) {
        setGoogleName(data.name || "");
        setPhoneStep(true);
        return;
      }
      router.push("/account");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la setarea telefonului");
      router.push("/account");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || data.detail || "Autentificare eșuată");
      router.push("/account");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-[70px]">
      <h1 className="text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f] text-center mb-8">
        {phoneStep ? tr.login.phoneRequired : "Autentificare"}
      </h1>

      {error && <div className="mb-4 rounded-[28px] bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {phoneStep ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          {googleName && (
            <p className="text-center text-sm text-[#6b6c6c]">
              Bun venit, <span className="font-semibold text-[#1d1d1f]">{googleName}</span>
            </p>
          )}
          <p className="text-center text-sm text-[#6b6c6c]">{tr.login.phoneDescription}</p>
          <input
            type="tel"
            required
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder={tr.login.phonePlaceholder}
            className="w-full rounded-[28px] border border-[#cccfcf] bg-white px-5 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#6b6c6c] focus:border-[#63ad36] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[28px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] py-3 text-sm font-medium text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : tr.login.continue}
          </button>
        </form>
      ) : (
        <>
          {GOOGLE_CLIENT_ID && (
            <div className="flex justify-center mb-6" ref={googleBtnRef} />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-[28px] border border-[#cccfcf] bg-white px-5 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#6b6c6c] focus:border-[#63ad36] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Parolă</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-[28px] border border-[#cccfcf] bg-white px-5 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#6b6c6c] focus:border-[#63ad36] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[28px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] py-3 text-sm font-medium text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Autentificare"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6b6c6c]">
            Nu ai cont?{" "}
            <Link href="/register" className="text-[#4e8f28] hover:underline">
              Înregistrează-te
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
