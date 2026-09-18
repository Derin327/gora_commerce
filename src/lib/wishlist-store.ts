import { create } from 'zustand';

interface WishlistState {
  wishlistIds: string[]; // Array of product IDs
  setWishlistIds: (ids: string[]) => void;
  toggleId: (id: string) => void;
}

export const useWishlistStore = create<WishlistState>((set) => ({
  wishlistIds: [],
  setWishlistIds: (ids) => set({ wishlistIds: ids }),
  toggleId: (id) =>
    set((state) => ({
      wishlistIds: state.wishlistIds.includes(id)
        ? state.wishlistIds.filter((wId) => wId !== id)
        : [...state.wishlistIds, id],
    })),
}));
