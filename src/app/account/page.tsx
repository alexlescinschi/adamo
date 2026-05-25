"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Package, LogOut, Loader2 } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        if (data) setUser(data);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [router]);

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
      <p className="text-slate-500 mb-6">{user.email || user.phone}</p>
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
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 p-6 opacity-50 cursor-not-allowed">
          <User className="h-8 w-8 text-slate-400" />
          <div>
            <p className="font-medium">Date personale</p>
            <p className="text-sm text-slate-500">În curând</p>
          </div>
        </div>
        <button
          onClick={() => {
            document.cookie = "ecommerceAccessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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
