"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

type PendingGoogle = {
  email: string;
  firstName: string;
  lastName: string;
};

// ponytail: CRM /oauth/google e blocat (env pe serverul lor). Google devine
// verificare email; userul alege parolă → register (sau login dacă există).
export default function GoogleFinishModal({
  pending,
  onClose,
}: {
  pending: PendingGoogle;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Încearcă register primul (user nou)
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pending.email,
          password,
          phone,
          first_name: pending.firstName,
          last_name: pending.lastName,
        }),
      });

      if (regRes.ok) {
        router.push("/account");
        return;
      }

      const regData = await regRes.json().catch(() => ({}));

      // 409 = cont deja există → fallback la login cu parola aleasă
      if (regRes.status === 409 || /exist/i.test(regData.message || "")) {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: pending.email, password }),
        });
        if (loginRes.ok) {
          router.push("/account");
          return;
        }
        const loginData = await loginRes.json().catch(() => ({}));
        throw new Error(
          loginRes.status === 401
            ? "Există deja un cont cu acest email, dar parola nu se potrivește cu cea setată anterior."
            : loginData.message || "Autentificare eșuată"
        );
      }

      throw new Error(regData.message || regData.error || "Înregistrare eșuată");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#1d1d1f]">Finalizează contul</h2>
          <button onClick={onClose} className="text-[#6b6c6c] hover:text-[#1d1d1f]" aria-label="Închide">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-[#6b6c6c]">
          Email confirmat: <span className="font-medium text-[#1d1d1f]">{pending.email}</span>
          <br />
          Alege o parolă și un telefon pentru contul tău.
        </p>

        {error && <div className="mb-4 rounded-[28px] bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Telefon</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06xx xxxxx"
              className="w-full rounded-[28px] border border-[#cccfcf] bg-white px-5 py-2.5 text-sm text-[#1d1d1f] focus:border-[#63ad36] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Parolă</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minim 8 caractere"
              className="w-full rounded-[28px] border border-[#cccfcf] bg-white px-5 py-2.5 text-sm text-[#1d1d1f] focus:border-[#63ad36] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[28px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] py-3 text-sm font-medium text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Continuă"}
          </button>
        </form>
      </div>
    </div>
  );
}
