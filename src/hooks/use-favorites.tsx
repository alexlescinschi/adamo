"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";

interface FavoriteItem {
  product_id: number;
  name: string;
  price: number;
  image_url?: string;
}

interface FavoritesContextValue {
  items: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (product_id: number) => void;
  isFavorite: (product_id: number) => boolean;
  toggleFavorite: (item: FavoriteItem) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("adamo-favorites");
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("adamo-favorites", JSON.stringify(items));
  }, [items]);

  const addFavorite = useCallback((item: FavoriteItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.product_id === item.product_id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeFavorite = useCallback((product_id: number) => {
    setItems((prev) => prev.filter((i) => i.product_id !== product_id));
  }, []);

  const isFavorite = useCallback((product_id: number) => {
    return items.some((i) => i.product_id === product_id);
  }, [items]);

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.product_id === item.product_id)) {
        return prev.filter((i) => i.product_id !== item.product_id);
      }
      return [...prev, item];
    });
  }, []);

  return (
    <FavoritesContext.Provider value={{ items, addFavorite, removeFavorite, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
