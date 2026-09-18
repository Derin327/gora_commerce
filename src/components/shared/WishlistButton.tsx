"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/lib/wishlist-store";
import { toggleWishlist } from "@/lib/actions/wishlist-actions";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export default function WishlistButton({ productId, className = "" }: WishlistButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { wishlistIds, toggleId } = useWishlistStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const isWishlisted = wishlistIds.includes(productId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if wrapped in a Link
    e.stopPropagation();

    if (isUpdating) return;
    setIsUpdating(true);

    const res = await toggleWishlist(productId);

    if (res.requiresAuth) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      setIsUpdating(false);
      return;
    }

    if (res.success) {
      toggleId(productId);
    }
    
    setIsUpdating(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      className={`p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 transition-all active:scale-95 ${className}`}
      aria-label="Toggle wishlist"
    >
      <Heart
        className={`w-5 h-5 transition-colors ${
          isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"
        } ${isUpdating ? "opacity-50" : ""}`}
      />
    </button>
  );
}
