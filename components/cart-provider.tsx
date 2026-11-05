"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/store";

type CartLine = { product: Product; quantity: number };
type CartContextValue = { items: CartLine[]; add: (product: Product) => void; remove: (id: string) => void; setQuantity: (id: string, quantity: number) => void; clear: () => void };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  useEffect(() => {
    try { const saved = localStorage.getItem("therapture-cart"); if (saved) setItems(JSON.parse(saved) as CartLine[]); } catch { localStorage.removeItem("therapture-cart"); }
  }, []);
  useEffect(() => { localStorage.setItem("therapture-cart", JSON.stringify(items)); }, [items]);
  const value = useMemo<CartContextValue>(() => ({
    items,
    add: (product) => setItems((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) return current.map((line) => line.product.id === product.id ? { ...line, quantity: Math.min(10, line.quantity + 1) } : line);
      return [...current, { product, quantity: 1 }];
    }),
    remove: (id) => setItems((current) => current.filter((line) => line.product.id !== id)),
    setQuantity: (id, quantity) => setItems((current) => current.map((line) => line.product.id === id ? { ...line, quantity: Math.max(1, Math.min(10, quantity)) } : line)),
    clear: () => setItems([]),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const value = useContext(CartContext); if (!value) throw new Error("useCart must be used within CartProvider"); return value; }
