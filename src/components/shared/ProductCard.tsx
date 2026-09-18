'use client';

import Image from "next/image";
import Link from "next/link";
import { Maximize2, BarChart2 } from "lucide-react";
import { useState } from "react";
import { useCompareStore } from "@/lib/store";
import WishlistButton from "@/components/shared/WishlistButton";

export interface ProductCardProps {
  id: string;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  imageUrl: string;
  variants: string[];
}

export default function ProductCard({
  id,
  name,
  originalPrice,
  discountedPrice,
  discountPercentage,
  imageUrl,
  variants,
}: ProductCardProps) {
  const [currentImage, setCurrentImage] = useState(imageUrl);
  const [compareToast, setCompareToast] = useState<string | null>(null);
  const { addItem: addCompare, removeItem: removeCompare, hasItem } = useCompareStore();
  const isCompared = hasItem(id);

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCompared) {
      removeCompare(id);
      setCompareToast("Removed from comparison");
    } else {
      const success = addCompare({
        id,
        name,
        imageUrl,
        price: discountedPrice,
        originalPrice,
        discountPercentage,
        variants,
      });
      if (!success) {
        setCompareToast("Max 3 products allowed");
      } else {
        setCompareToast("Added to comparison");
      }
    }
    setTimeout(() => setCompareToast(null), 2000);
  };

  const displayVariants = variants ? variants.slice(0, 3) : [];

  return (
    <div className="group relative w-full h-full cursor-pointer flex flex-col gap-3">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 flex-shrink-0 group/image">
        <Link href={`/product/${id}`} className="block w-full h-full">
          <img
            src={currentImage}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105"
          />
        </Link>

        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-black text-white px-1.5 py-0.5 text-xs font-semibold tracking-wider pointer-events-none z-10">
            -{discountPercentage}%
          </div>
        )}

        <WishlistButton productId={id} className="absolute top-2 right-2 z-10" />

        <Link href={`/product/${id}`} className="absolute top-2 right-12 p-1.5 bg-white border border-transparent hover:border-black transition-colors z-10 opacity-0 group-hover/image:opacity-100">
          <Maximize2 className="w-3.5 h-3.5 text-black" />
        </Link>

        {/* Compare button - appears on hover */}
        <button
          onClick={handleCompareToggle}
          className={`absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 opacity-0 group-hover/image:opacity-100 translate-y-1 group-hover/image:translate-y-0 ${
            isCompared 
              ? "bg-black text-white" 
              : "bg-white/95 text-black hover:bg-black hover:text-white border-t border-gray-200"
          }`}
        >
          <BarChart2 className="w-3 h-3" />
          {isCompared ? "✓ Comparing" : "Compare"}
        </button>

        {/* Toast notification */}
        {compareToast && (
          <div className="absolute inset-x-0 top-2 flex justify-center z-20 pointer-events-none">
            <span className="bg-black/80 text-white text-[10px] font-semibold px-3 py-1 rounded-full">
              {compareToast}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center flex-grow px-1 text-center">
        <Link href={`/product/${id}`} className="w-full">
          <h3 className="text-sm text-black line-clamp-2 w-full mb-1 min-h-[40px] hover:text-[#e32c2b] transition-colors">{name}</h3>
        </Link>
        <div className="flex items-center justify-center gap-2 mb-2">
          {originalPrice > discountedPrice && (
            <span className="text-sm text-gray-400 line-through">Rs.{originalPrice}</span>
          )}
          <span className="text-sm font-bold text-black">Rs.{discountedPrice}</span>
        </div>

        {displayVariants.length > 0 ? (
          <div className="flex items-center justify-center gap-1.5 mt-auto">
            {displayVariants.map((v, i) => (
              <div
                key={i}
                onMouseEnter={() => setCurrentImage(v)}
                onClick={(e) => { e.preventDefault(); setCurrentImage(v); }}
                className={`w-6 h-6 overflow-hidden relative cursor-pointer border ${currentImage === v ? 'border-black scale-110' : 'border-gray-200 hover:border-gray-400'} transition-all`}
              >
                <img src={v} alt={`Variant ${i}`} className="w-full h-full object-cover" />
              </div>
            ))}
            {variants.length > 3 && (
              <span className="text-[10px] text-gray-500 font-medium ml-1">
                +{variants.length - 3}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-auto h-6" />
        )}
      </div>
    </div>
  );
}

