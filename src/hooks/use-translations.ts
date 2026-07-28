"use client";

import { useParams } from "next/navigation";
import { getDict } from "@/lib/translations";
import { normalizeLocale } from "@/lib/locale";

export function useLocale() {
  const params = useParams();
  return normalizeLocale(params?.locale as string | undefined);
}

export function useTranslations() {
  const locale = useLocale();
  return getDict(locale);
}
