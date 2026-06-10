"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current || (window as any).google?.accounts?.id) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        shape: "pill",
        theme: "outline",
        size: "large",
        text: "signup_with",
        width: 320,
      });
    };
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
      if (!res.ok) throw new Error(data.error || data.message || "Înregistrare Google eșuată");
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || data.detail || "Înregistrare eșuată");

      router.push("/account");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-[70px]">
      <h1 className="text-[34px] font-semibold tracking-[-0.031em] text-[#1d1d1f] text-center mb-8">Înregistrare</h1>

      {error && <div className="mb-4 rounded-[28px] bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {GOOGLE_CLIENT_ID && (
        <div className="flex justify-center mb-6" ref={googleBtnRef} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Prenume</label>
            <input
              required
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full rounded-[28px] border border-[#cccfcf] bg-white px-5 py-2.5 text-sm text-[#1d1d1f] focus:border-[#63ad36] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Nume</label>
            <input
              required
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full rounded-[28px] border border-[#cccfcf] bg-white px-5 py-2.5 text-sm text-[#1d1d1f] focus:border-[#63ad36] focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-[28px] border border-[#cccfcf] bg-white px-5 py-2.5 text-sm text-[#1d1d1f] focus:border-[#63ad36] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Telefon</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-[28px] border border-[#cccfcf] bg-white px-5 py-2.5 text-sm text-[#1d1d1f] focus:border-[#63ad36] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Parolă</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-[28px] border border-[#cccfcf] bg-white px-5 py-2.5 text-sm text-[#1d1d1f] focus:border-[#63ad36] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[28px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] py-3 text-sm font-medium text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Înregistrare"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6b6c6c]">
        Ai deja cont?{" "}
        <Link href="/login" className="text-[#4e8f28] hover:underline">
          Autentifică-te
        </Link>
      </p>
    </div>
  );
}
