"use client";

import { useCallback } from "react";

// ponytail: pe paginile de listă, product.unit_id lipsește (CRM list endpoint nu-l returnează).
// Acest hook rezolvă unit_id real prin lazy fetch la /api/products/{id}/unit.
// Dacă product.unit_id există deja și diferă de product.id (pagină de DETAIL), skip fetch.
export function useResolveUnit() {
  return useCallback(async (product: { id: number; unit_id?: number }): Promise<number> => {
    if (product.unit_id && product.unit_id !== product.id) return product.unit_id;
    try {
      const res = await fetch(`/api/products/${product.id}/unit`);
      const data = await res.json();
      return data.unit_id || product.id;
    } catch {
      return product.id;
    }
  }, []);
}
