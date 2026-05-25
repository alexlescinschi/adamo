import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Adamo. Toate drepturile rezervate.
          </p>
          <div className="flex gap-4">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
              Acasă
            </Link>
            <Link href="/cart" className="text-sm text-slate-500 hover:text-slate-900">
              Coș
            </Link>
            <Link href="/account" className="text-sm text-slate-500 hover:text-slate-900">
              Cont
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
