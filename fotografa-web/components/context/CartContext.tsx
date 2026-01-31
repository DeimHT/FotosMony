"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CartItem,
  loadCartFromStorage,
  saveCartToStorage,
} from "FotosMony/lib/cart";

type CartContextValue = {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  addItems: (items: CartItem[]) => void;
  removeItem: (fotoId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadCartFromStorage());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    saveCartToStorage(items);
  }, [mounted, items]);

  const addItems = useCallback((newItems: CartItem[]) => {
    if (newItems.length === 0) return;
    setItems((prev) => {
      const existingIds = new Set(prev.map((i) => i.fotoId));
      const toAdd = newItems.filter((i) => !existingIds.has(i.fotoId));
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });
  }, []);

  const removeItem = useCallback((fotoId: string) => {
    setItems((prev) => prev.filter((i) => i.fotoId !== fotoId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalCount = items.length;
  const totalPrice = items.reduce((sum, i) => sum + i.precio, 0);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalCount,
      totalPrice,
      addItems,
      removeItem,
      clearCart,
    }),
    [items, totalCount, totalPrice, addItems, removeItem, clearCart]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
