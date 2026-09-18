"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store";
import { ShieldCheck, Ruler } from "lucide-react";
import SizeChartModal from "./SizeChartModal";
import WishlistButton from "./WishlistButton";

interface ProductFormProps {
  product: {
    id: string;
    name: string;
    description: string;
  };
  availableColors: { name: string; image: string }[];
  availableSizes: string[];
  selectedColor: string;
  selectedSize: string;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  currentVariant: any;
  category?: string; // used to determine which size chart to show
}

export default function ProductForm({ 
  product, 
  availableColors, 
  availableSizes, 
  selectedColor, 
  selectedSize, 
  onColorSelect, 
  onSizeSelect,
  currentVariant,
  category = "shirts"
}: ProductFormProps) {
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  
  const addItem = useCartStore((state) => state.addItem);

  const isOutOfStock = currentVariant && currentVariant.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock || !currentVariant) return;
    
    addItem({
      id: currentVariant.id, // Use specific variant ID!
      productId: product.id,
      name: product.name,
      price: currentVariant.price,
      image: currentVariant.image,
      quantity: quantity,
      size: selectedSize,
      color: selectedColor,
    });
  };

  return (
    <>
    <div className="flex flex-col gap-6">
      {/* Colors */}
      {availableColors.length > 0 && (
        <div>
          <span className="block text-[13px] font-bold text-black mb-3">Color</span>
          <div className="flex gap-2">
            {availableColors.map(color => (
              <div key={color.name} className="relative group">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onColorSelect(color.name); }}
                  className={`w-12 h-16 border-2 transition-all p-0.5 ${selectedColor === color.name ? "border-black" : "border-transparent hover:border-gray-300"}`}
                  aria-label={`Select color ${color.name}`}
                >
                  <img src={color.image} alt={color.name} className="w-full h-full object-cover" />
                </button>
                {/* Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-[#1a1a1a] text-white text-xs font-semibold px-3 py-1.5 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg">
                  {color.name}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#1a1a1a]"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      {availableSizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold text-black">Size</span>
            <button
              type="button"
              onClick={() => setIsSizeChartOpen(true)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-black transition-colors uppercase tracking-wider border-b border-dashed border-gray-400 hover:border-black pb-0.5"
            >
              <Ruler className="w-3 h-3" />
              Size Chart
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map(size => (
              <button
                type="button"
                key={size}
                onClick={(e) => { e.preventDefault(); onSizeSelect(size); }}
                className={`min-w-[40px] h-10 px-3 flex items-center justify-center border text-[13px] transition-colors ${
                  selectedSize === size ? "border-black text-black" : "border-gray-200 text-gray-600 hover:border-black hover:text-black"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stock Warning */}
      {isOutOfStock && (
        <div className="text-red-500 text-sm font-bold mt-2">
          This selected variant is currently out of stock.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mt-2">
        <div className="flex items-center border border-gray-200 bg-gray-50 h-12">
          <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 text-gray-500 hover:text-black transition-colors">−</button>
          <span className="w-4 text-center text-[13px] font-bold">{quantity}</span>
          <button type="button" onClick={() => setQuantity(quantity + 1)} className="px-4 text-gray-500 hover:text-black transition-colors">+</button>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock || !currentVariant}
          className={`flex-1 font-bold tracking-widest text-[13px] transition-colors ${
            isOutOfStock || !currentVariant ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800 text-white cursor-pointer"
          }`}
        >
          {!currentVariant ? "UNAVAILABLE" : isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}
        </button>
        <WishlistButton productId={product.id} className="w-12 !rounded-none flex items-center justify-center border border-gray-200" />
      </div>

      {/* Delivery Info */}
      <div className="space-y-3 pt-2 text-[13px] text-gray-500">
        <p className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-600" /> <strong className="text-gray-600">Delivery :</strong> Up to 2-4 business days
        </p>
        <p className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-600" /> <strong className="text-gray-600">Dispatch :</strong> Within 24 hrs
        </p>
        <p className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-600" /> <strong className="text-gray-600">Payment :</strong> Prepaid / Partial Payment
        </p>
      </div>

      {/* Secure Checkout Box */}
      <div className="bg-[#f4f3f0] p-6 text-center mt-2 flex flex-col items-center">
        <span className="text-[13px] font-bold text-black mb-3">Guaranteed Safe And Secure Checkout</span>
        <div className="flex gap-4">
           {/* Mock logos for PhonePe/GPay */}
           <span className="text-purple-700 font-bold text-xs italic">PhonePe</span>
           <span className="text-gray-600 font-bold text-xs">G Pay</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border border-gray-100">
        <div className="flex border-b border-gray-100 px-4">
          <button 
            className={`py-4 px-2 text-[15px] font-bold transition-colors border-b-2 ${activeTab === 'description' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button 
            className={`py-4 px-6 text-[15px] font-bold transition-colors border-b-2 ${activeTab === 'additional' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
            onClick={() => setActiveTab('additional')}
          >
            Additional information
          </button>
        </div>
        <div className="p-6 text-[15px] text-gray-600 leading-relaxed font-light">
          {activeTab === 'description' ? (
            <p>{product.description}</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {availableColors.length > 0 && (
                  <tr className="border-b border-dashed border-gray-100">
                    <td className="py-3 font-bold text-black w-1/4">Color</td>
                    <td className="py-3 italic">{availableColors.map(c => c.name).join(", ")}</td>
                  </tr>
                )}
                {availableSizes.length > 0 && (
                  <tr>
                    <td className="py-3 font-bold text-black w-1/4">Size</td>
                    <td className="py-3 italic">{availableSizes.join(", ")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>

    {/* Size Chart Modal */}
    <SizeChartModal
      isOpen={isSizeChartOpen}
      onClose={() => setIsSizeChartOpen(false)}
      category={category}
    />
    </>
  );
}
