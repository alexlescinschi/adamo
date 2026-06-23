"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";

export interface CartItem {
  product_id: number;
  unit_id: number;
  name: string;
  price: number;
  qty: number;
  image?: string;
  stock?: number;
  selected?: boolean; // default true; legacy items without it are treated as selected
}

interface CartContextValue {
  items: CartItem[];
  selectedItems: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_id: number, unit_id: number) => void;
  updateQty: (product_id: number, unit_id: number, qty: number) => void;
  toggleSelected: (product_id: number, unit_id: number) => void;
  selectAll: (selected: boolean) => void;
  clearCart: () => void;
  total: number;       // sum of selected items only
  totalAll: number;    // sum of all items
  allSelected: boolean;
  someSelected: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const sameItem = (i: CartItem, product_id: number, unit_id: number) =>
  i.product_id === product_id && i.unit_id === unit_id;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("adamo-cart");
      if (stored) {
        // Backwards-compat: legacy items without `selected` default to selected.
        // ponytail: curăță itemi cu bug-ul unit_id===product_id (checkout pica 409).
        // Userul îi readaugă cu unit_id corect din mapper-ul reparat.
        const parsed: CartItem[] = (JSON.parse(stored) as CartItem[])
          .filter((i) => i.unit_id !== i.product_id)
          .map((i) => ({ ...i, selected: i.selected !== false }));
        setItems(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("adamo-cart", JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameItem(i, item.product_id, item.unit_id));
      if (existing) {
        const newQty = Math.min(existing.qty + item.qty, existing.stock || 99);
        return prev.map((i) =>
          sameItem(i, item.product_id, item.unit_id) ? { ...i, qty: newQty } : i
        );
      }
      const qty = Math.min(item.qty, item.stock || 99);
      return [...prev, { ...item, qty, selected: item.selected !== false }];
    });
  }, []);

  const removeItem = useCallback((product_id: number, unit_id: number) => {
    setItems((prev) => prev.filter((i) => !sameItem(i, product_id, unit_id)));
  }, []);

  const updateQty = useCallback((product_id: number, unit_id: number, qty: number) => {
    if (qty <= 0) {
      removeItem(product_id, unit_id);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        sameItem(i, product_id, unit_id)
          ? { ...i, qty: Math.min(qty, i.stock || 99) }
          : i
      )
    );
  }, [removeItem]);

  const toggleSelected = useCallback((product_id: number, unit_id: number) => {
    setItems((prev) =>
      prev.map((i) =>
        sameItem(i, product_id, unit_id) ? { ...i, selected: !i.selected } : i
      )
    );
  }, []);

  const selectAll = useCallback((selected: boolean) => {
    setItems((prev) => prev.map((i) => ({ ...i, selected })));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const selectedItems = items.filter((i) => i.selected !== false);
  const total = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalAll = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        selectedItems,
        addItem,
        removeItem,
        updateQty,
        toggleSelected,
        selectAll,
        clearCart,
        total,
        totalAll,
        allSelected,
        someSelected,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
