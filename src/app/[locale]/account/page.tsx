"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { User, Package, LogOut, Loader2, Check, X } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function AccountPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ro";
  const tr = useTranslations();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ displayName: "", phone: "", address: "" });
  const translateError = (code: unknown) =>
    typeof code === "string" && Object.prototype.hasOwnProperty.call(tr.errors, code)
      ? tr.errors[code as keyof typeof tr.errors]
      : tr.errors.profileUpdateFailed;

  useEffect(() => {
    fetch("/api/account/me")
      .then((res) => {
        if (res.status === 401) {
          router.push(`/${locale}/login`);
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
  }, [locale, router]);

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
      if (!res.ok) {
        setError(translateError(data.code));
        return;
      }
      setUser((u: any) => ({ ...u, user: data.user }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditing(false);
    } catch {
      setError(tr.errors.profileUpdateFailed);
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
        <h1 className="text-2xl font-bold">{tr.account.signedOutTitle}</h1>
        <p className="mt-2 text-slate-500">{tr.account.signedOutBody}</p>
        <Link href={`/${locale}/login`} className="mt-4 inline-block rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800">
          {tr.login.title}
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-2">{tr.account.title}</h1>
      <p className="text-slate-500 mb-6">{user.email || user.user?.email}</p>

      {editing ? (
        <div className="mb-6 rounded-[14px] border border-[#e4e8e4] bg-white p-6">
          <h2 className="text-lg font-bold text-[#1d1d1f] mb-4">{tr.account.editTitle}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1">{tr.account.displayName}</label>
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="w-full rounded-[10px] border border-[#e4e8e4] bg-white px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1">{tr.common.email}</label>
              <input
                value={user.email || user.user?.email || ""}
                disabled
                className="w-full rounded-[10px] border border-[#e4e8e4] bg-[#f3f6f6] px-4 py-2.5 text-sm text-[#6b6c6c]"
              />
              <p className="mt-1 text-[11px] text-[#6b6c6c]">{tr.account.emailReadOnly}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1">{tr.account.phone}</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={tr.account.phoneExample}
                className="w-full rounded-[10px] border border-[#e4e8e4] bg-white px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1">{tr.account.address}</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder={tr.account.addressExample}
                className="w-full rounded-[10px] border border-[#e4e8e4] bg-white px-4 py-2.5 text-sm focus:border-[#63ad36] focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
          {saved && <p className="mt-3 text-[13px] text-[#34781f]">{tr.account.saved}</p>}

          <div className="mt-5 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#7cc44e] to-[#63ad36] px-6 py-2.5 text-sm font-semibold text-white hover:from-[#63ad36] hover:to-[#4e8f28] transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {tr.common.save}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-2 rounded-[10px] border border-[#e4e8e4] bg-white px-6 py-2.5 text-sm font-semibold text-[#6b6c6c] hover:bg-[#f3f6f6] transition-colors"
            >
              <X className="h-4 w-4" />
              {tr.common.cancel}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href={`/${locale}/account/orders`}
          className="flex items-center gap-4 rounded-lg border border-slate-200 p-6 hover:border-slate-900 transition-colors"
        >
          <Package className="h-8 w-8 text-slate-400" />
          <div>
            <p className="font-medium">{tr.account.ordersTitle}</p>
            <p className="text-sm text-slate-500">{tr.account.ordersSubtitle}</p>
          </div>
        </Link>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-4 rounded-lg border border-slate-200 p-6 hover:border-slate-900 transition-colors text-left"
        >
          <User className="h-8 w-8 text-slate-400" />
          <div>
            <p className="font-medium">{tr.account.personalData}</p>
            <p className="text-sm text-slate-500">{form.displayName || form.phone || tr.account.personalDataSubtitle}</p>
          </div>
        </button>
        <button
          onClick={async () => {
            localStorage.removeItem("adamo-checkout");
            await fetch("/api/auth/logout", { method: "POST" });
            router.push(`/${locale}`);
          }}
          className="flex items-center gap-4 rounded-lg border border-slate-200 p-6 hover:border-red-300 hover:bg-red-50 transition-colors text-left"
        >
          <LogOut className="h-8 w-8 text-slate-400" />
          <div>
            <p className="font-medium">{tr.account.logout}</p>
            <p className="text-sm text-slate-500">{tr.account.logoutSubtitle}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
