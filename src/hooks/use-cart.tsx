"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";

export interface CartItem {
  product_id: number;
  unit_id: number;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_id: number, unit_id: number) => void;
  updateQty: (product_id: number, unit_id: number, qty: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("adamo-cart");
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("adamo-cart", JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product_id === item.product_id && i.unit_id === item.unit_id
      );
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id && i.unit_id === item.unit_id
            ? { ...i, qty: i.qty + item.qty }
            : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((product_id: number, unit_id: number) => {
    setItems((prev) =>
      prev.filter((i) => !(i.product_id === product_id && i.unit_id === unit_id))
    );
  }, []);

  const updateQty = useCallback((product_id: number, unit_id: number, qty: number) => {
    if (qty <= 0) {
      removeItem(product_id, unit_id);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === product_id && i.unit_id === unit_id ? { ...i, qty } : i
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
