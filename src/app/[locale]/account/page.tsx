"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Package, LogOut, Loader2, Check, X } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ displayName: "", phone: "", address: "" });

  useEffect(() => {
    fetch("/api/account/me")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser(data);
          setForm({
            displayName: data.user?.username || "",
            phone: data.user?.phone || "",
            address: data.user?.address || "",
          });
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Salvare eșuată");
      setUser((u: any) => ({ ...u, user: data.user }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-bold">Nu ești autentificat</h1>
        <p className="mt-2 text-slate-500">Autentifică-te pentru a vedea contul tău.</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800">
          Autentificare
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-2">Contul meu</h1>
      <p className="text-slate-500 mb-6">{user.email || user.user?.email}</p>

      {editing ? (
        <div className="mb-6 rounded-[14px] border border-[#e4e8e4] bg-white p-6">
          <h2 className="text-lg font-bold text-[#1d1d1f] mb-4">Editează datele personale</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Nume afișat</label>
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="w-full rounded-[10px] border border-[#e4e8e4] bg-white px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Email</label>
              <input
                value={user.email || user.user?.email || ""}
                disabled
                className="w-full rounded-[10px] border border-[#e4e8e4] bg-[#f3f6f6] px-4 py-2.5 text-sm text-[#6b6c6c]"
              />
              <p className="mt-1 text-[11px] text-[#6b6c6c]">Email-ul nu poate fi modificat.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Telefon</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="De ex. 069 123 456"
                className="w-full rounded-[10px] border border-[#e4e8e4] bg-white px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Adresă</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="De ex. Chișinău, Strada Exemplu 1"
                className="w-full rounded-[10px] border border-[#e4e8e4] bg-white px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
          {saved && <p className="mt-3 text-[13px] text-[#34781f]">Datele au fost salvate.</p>}

          <div className="mt-5 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-2.5 text-sm font-semibold text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvează
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-2 rounded-[10px] border border-[#e4e8e4] bg-white px-6 py-2.5 text-sm font-semibold text-[#6b6c6c] hover:bg-[#f3f6f6] transition-colors"
            >
              <X className="h-4 w-4" />
              Anulează
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/account/orders"
          className="flex items-center gap-4 rounded-lg border border-slate-200 p-6 hover:border-slate-900 transition-colors"
        >
          <Package className="h-8 w-8 text-slate-400" />
          <div>
            <p className="font-medium">Comenzile mele</p>
            <p className="text-sm text-slate-500">Vezi istoricul comenzilor</p>
          </div>
        </Link>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-4 rounded-lg border border-slate-200 p-6 hover:border-slate-900 transition-colors text-left"
        >
          <User className="h-8 w-8 text-slate-400" />
          <div>
            <p className="font-medium">Date personale</p>
            <p className="text-sm text-slate-500">{form.displayName || form.phone || "Editează nume, telefon, adresă"}</p>
          </div>
        </button>
        <button
          onClick={async () => {
            localStorage.removeItem("adamo-checkout");
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/");
          }}
          className="flex items-center gap-4 rounded-lg border border-slate-200 p-6 hover:border-red-300 hover:bg-red-50 transition-colors text-left"
        >
          <LogOut className="h-8 w-8 text-slate-400" />
          <div>
            <p className="font-medium">Deconectare</p>
            <p className="text-sm text-slate-500">Ieși din cont</p>
          </div>
        </button>
      </div>
    </div>
  );
}
