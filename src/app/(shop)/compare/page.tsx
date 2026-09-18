"use client";

import { useCompareStore, useCartStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { X, ShoppingCart, BarChart2, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const COMPARE_ROWS = [
  { label: "Price", render: (item: any) => <span className="text-base font-bold text-black">Rs.{item.price}</span> },
  { label: "Original Price", render: (item: any) => item.originalPrice && item.originalPrice > item.price ? <span className="text-sm text-gray-400 line-through">Rs.{item.originalPrice}</span> : <span className="text-gray-300">—</span> },
  { label: "Discount", render: (item: any) => item.discountPercentage > 0 ? <span className="text-xs font-bold bg-black text-white px-2 py-0.5">-{item.discountPercentage}%</span> : <span className="text-gray-300">—</span> },
  { label: "Category", render: (item: any) => <span className="text-sm text-gray-600 capitalize">{item.category || "—"}</span> },
  { label: "Colors", render: (item: any) => item.variants && item.variants.length > 0 ? (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {item.variants.slice(0, 4).map((v: string, i: number) => (
        <img key={i} src={v} alt="color" className="w-7 h-7 object-cover border border-gray-200" />
      ))}
      {item.variants.length > 4 && <span className="text-xs text-gray-400">+{item.variants.length - 4}</span>}
    </div>
  ) : <span className="text-gray-300">—</span> },
];

export default function ComparePage() {
  const { items, removeItem, clearAll } = useCompareStore();
  const { addItem } = useCartStore();
  const router = useRouter();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAddToCart = (item: any) => {
    addItem({ id: item.id + "_cmp", productId: item.id, name: item.name, price: item.price, image: item.imageUrl, quantity: 1 });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6 pb-16">
        <BarChart2 className="w-14 h-14 text-gray-200 mb-6" />
        <h1 className="text-xl font-bold uppercase tracking-widest text-black mb-3">Nothing to Compare</h1>
        <p className="text-gray-400 text-sm mb-8 max-w-xs">Add 2 or 3 products using the Compare button on any product.</p>
        <Link href="/" className="bg-black text-white px-8 py-3 text-sm font-bold uppercase tracking-widest">
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* Sticky top header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-black transition-colors p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm md:text-lg font-bold uppercase tracking-widest text-black flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Compare
              </h1>
              <p className="text-xs text-gray-400">{items.length} of 3 products</p>
            </div>
          </div>
          <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-600 transition-colors font-medium underline">
            Clear All
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {/* MOBILE: card-style stacked comparison */}
        <div className="block md:hidden space-y-8">
          {/* Product Cards Row — always single row, 3 cols for 3 items, 2 cols for 2 */}
          <div className={`grid gap-2 ${items.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {items.map((item) => (
              <div key={item.id} className="relative bg-gray-50 border border-gray-100 p-1.5 flex flex-col items-center text-center">
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-1 right-1 bg-black text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
                <Link href={"/product/" + item.id} className="w-full">
                  <img src={item.imageUrl} alt={item.name} className="w-full aspect-[3/4] object-cover mb-1.5" />
                </Link>
                <Link href={"/product/" + item.id} className={`font-semibold text-black hover:text-red-600 transition-colors line-clamp-2 mb-0.5 w-full ${items.length === 3 ? "text-[10px]" : "text-xs"}`}>
                  {item.name}
                </Link>
                <div className={`font-bold text-black ${items.length === 3 ? "text-xs" : "text-sm"}`}>Rs.{item.price}</div>
                {item.originalPrice && item.originalPrice > item.price && (
                  <div className="text-[10px] text-gray-400 line-through">Rs.{item.originalPrice}</div>
                )}
                <button
                  onClick={() => handleAddToCart(item)}
                  className={`mt-2 w-full flex items-center justify-center gap-1 py-1.5 font-bold uppercase tracking-wider transition-all ${
                    addedId === item.id ? "bg-green-600 text-white" : "bg-black text-white hover:bg-gray-800"
                  } ${items.length === 3 ? "text-[9px]" : "text-xs"}`}
                >
                  {addedId === item.id
                    ? <><Check className="w-2.5 h-2.5" /> Added</>
                    : <><ShoppingCart className="w-2.5 h-2.5" /> {items.length === 3 ? "Cart" : "Add to Cart"}</>}
                </button>
              </div>
            ))}
          </div>

          {/* Comparison Rows — mobile accordion style */}
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {COMPARE_ROWS.map((row, idx) => (
              <div key={idx} className={idx !== 0 ? "border-t border-gray-100" : ""}>
                <div className="bg-gray-50 px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{row.label}</span>
                </div>
                <div className="grid divide-x divide-gray-100" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
                  {items.map((item) => (
                    <div key={item.id} className="px-1.5 py-2.5 flex items-center justify-center text-center">
                      {row.render(item)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DESKTOP: classic table layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-left py-4 pr-8 w-36 align-bottom">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Product</span>
                </th>
                {items.map((item) => (
                  <th key={item.id} className="text-center pb-6 px-4 align-top">
                    <div className="relative inline-block mx-auto">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute -top-2 -right-2 z-10 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <Link href={"/product/" + item.id}>
                        <img src={item.imageUrl} alt={item.name} className="w-44 h-56 object-cover border border-gray-100 hover:border-gray-300 transition-colors" />
                      </Link>
                    </div>
                    <Link href={"/product/" + item.id} className="block mt-3 text-sm font-semibold text-black hover:text-red-600 transition-colors line-clamp-2 max-w-[176px] mx-auto">
                      {item.name}
                    </Link>
                    <div className="mt-1 text-base font-bold text-black">Rs.{item.price}</div>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <div className="text-sm text-gray-400 line-through">Rs.{item.originalPrice}</div>
                    )}
                    <button
                      onClick={() => handleAddToCart(item)}
                      className={`mt-3 w-full max-w-[176px] mx-auto flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                        addedId === item.id ? "bg-green-600 text-white" : "bg-black text-white hover:bg-gray-800"
                      }`}
                    >
                      {addedId === item.id ? <><Check className="w-3.5 h-3.5" /> Added!</> : <><ShoppingCart className="w-3.5 h-3.5" /> Add to Cart</>}
                    </button>
                  </th>
                ))}
                {Array.from({ length: 3 - items.length }).map((_, i) => (
                  <th key={i} className="text-center pb-6 px-4 align-top">
                    <div className="w-44 h-56 border-2 border-dashed border-gray-200 mx-auto flex flex-col items-center justify-center">
                      <span className="text-3xl text-gray-200 mb-1">+</span>
                      <Link href="/" className="text-xs text-gray-400 underline">Add product</Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {COMPARE_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="py-5 pr-8 text-xs font-bold uppercase tracking-widest text-gray-500">{row.label}</td>
                  {items.map((item) => (
                    <td key={item.id} className="py-5 px-4 text-center">{row.render(item)}</td>
                  ))}
                  {Array.from({ length: 3 - items.length }).map((_, i) => (
                    <td key={i} className="py-5 px-4 text-center text-gray-200">—</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
