import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  size?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      addItem: (item) => {
        const items = get().items;
        const existingItem = items.find((i) => i.id === item.id);
        
        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          });
        } else {
          set({ items: [...items, item] });
        }
        set({ isOpen: true }); // Auto open cart on add
      },
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "gora-cart-storage",
    }
  )
);

// ── Compare Store ──────────────────────────────────────────────
export interface CompareProduct {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  category?: string;
  variants?: string[];
  slug?: string;
}

interface CompareStore {
  items: CompareProduct[];
  isBarVisible: boolean;
  addItem: (product: CompareProduct) => boolean; // returns false if max reached
  removeItem: (id: string) => void;
  clearAll: () => void;
  hasItem: (id: string) => boolean;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      isBarVisible: false,
      addItem: (product) => {
        const items = get().items;
        if (items.length >= 3) return false;       // hard cap at 3
        if (items.find((i) => i.id === product.id)) return true; // already added
        set({ items: [...items, product], isBarVisible: true });
        return true;
      },
      removeItem: (id) => {
        const newItems = get().items.filter((i) => i.id !== id);
        set({ items: newItems, isBarVisible: newItems.length > 0 });
      },
      clearAll: () => set({ items: [], isBarVisible: false }),
      hasItem: (id) => !!get().items.find((i) => i.id === id),
    }),
    { name: "gora-compare-storage" }
  )
);
