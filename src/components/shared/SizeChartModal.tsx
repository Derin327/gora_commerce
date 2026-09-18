"use client";

import { X, Ruler } from "lucide-react";
import { useEffect } from "react";

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string; // e.g. "shirts", "bottoms", "hoodies", "oversized"
}

// Determine which chart image to show based on category
function getChartImage(category: string): { src: string; label: string } {
  const cat = category.toLowerCase();
  const isBottoms = ["bottoms", "jeans", "cargos", "shorts", "pants", "trousers"].some((k) =>
    cat.includes(k)
  );
  if (isBottoms) {
    return { src: "/size-chart-bottoms.jpg", label: "Men's Bottoms Size Chart" };
  }
  return { src: "/size-chart-tops.jpg", label: "Men's Tops Size Chart" };
}

export default function SizeChartModal({ isOpen, onClose, category }: SizeChartModalProps) {
  const { src, label } = getChartImage(category);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet — slides up from bottom on mobile, centered on desktop */}
      <div
        className="relative z-10 bg-white w-full sm:max-w-md sm:mx-4 sm:rounded-lg overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-black" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-black">{label}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Chart image — scrollable */}
        <div className="overflow-y-auto flex-1">
          <img
            src={src}
            alt={label}
            className="w-full h-auto"
            style={{ display: "block" }}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <p className="text-[11px] text-gray-500 text-center">
            Need help? Measure yourself and match with the chart above.
          </p>
        </div>
      </div>
    </div>
  );
}
