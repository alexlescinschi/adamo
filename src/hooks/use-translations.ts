"use client";

import { useParams } from "next/navigation";
import { getDict } from "@/lib/translations";

export function useTranslations() {
  const params = useParams();
  const locale = (params?.locale as string) || "ro";
  return getDict(locale);
}
