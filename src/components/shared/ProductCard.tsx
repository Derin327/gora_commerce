'use client';

import Image from "next/image";
import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { useState } from "react";

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
          <div className="absolute top-2 left-2 bg-black text-white px-1.5 py-0.5 text-xs font-semibold tracking-wider pointer-events-none">
            -{discountPercentage}%
          </div>
        )}

        <Link href={`/product/${id}`} className="absolute top-2 right-2 p-1.5 bg-white border border-transparent hover:border-black transition-colors">
          <Maximize2 className="w-3.5 h-3.5 text-black" />
        </Link>
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

