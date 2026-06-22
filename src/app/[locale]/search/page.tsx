import { Suspense } from "react";
import { SearchContent } from "@/components/search-content";
import { Loader2 } from "lucide-react";

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
