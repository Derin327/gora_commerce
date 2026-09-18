"use client";

import { useCompareStore } from "@/lib/store";
import { X, ArrowRight, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function CompareBar() {
  const { items, isBarVisible, removeItem, clearAll } = useCompareStore();

  if (!isBarVisible || items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white border-t-2 border-black shadow-2xl">
        <div className="max-w-[1400px] mx-auto px-3 md:px-8 py-3 flex items-center gap-3">

          {/* Label - hidden on small screens */}
          <div className="hidden lg:flex items-center gap-2 text-black font-bold uppercase tracking-widest text-xs flex-shrink-0">
            <BarChart2 className="w-4 h-4" />
            Compare
          </div>

          {/* Product thumbnails */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {items.map((item) => (
              <div key={item.id} className="relative flex items-center gap-2 bg-gray-50 border border-gray-200 px-2 py-1.5 flex-shrink-0">
                <img src={item.imageUrl} alt={item.name} className="w-9 h-11 object-cover flex-shrink-0" />
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-black line-clamp-1 max-w-[90px]">{item.name}</p>
                  <p className="text-xs text-gray-500">Rs.{item.price}</p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute -top-2 -right-2 bg-black text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

            {/* Empty slot indicators */}
            {Array.from({ length: 3 - items.length }).map((_, i) => (
              <div key={i} className="flex items-center justify-center w-12 h-12 border-2 border-dashed border-gray-200 flex-shrink-0">
                <span className="text-sm text-gray-300 font-bold">+</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={clearAll} className="text-xs text-gray-400 hover:text-black transition-colors hidden md:block underline">
              Clear
            </button>
            <Link
              href="/compare"
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                items.length >= 2
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-gray-200 text-gray-400 pointer-events-none"
              }`}
            >
              Compare
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
