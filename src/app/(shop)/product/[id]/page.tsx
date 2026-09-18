"use client";

import { useState, useEffect } from "react";
import ProductForm from "@/components/shared/ProductForm";
import ProductCard from "@/components/shared/ProductCard";
import { createClient } from "@/utils/supabase/client";
import { Loader2, X, ZoomIn, ZoomOut, MousePointer2, BarChart2, Share2 } from "lucide-react";
import { useCompareStore } from "@/lib/store";

// Centralized mock database for fallback
const mockDatabase = [
  {
    id: "p1",
    name: "Graffiti Wash Drop-Shoulder Shirt",
    basePrice: 990,
    originalPrice: 1599,
    discountBadge: "-27%",
    description: "Make a statement with this Graffiti Wash Drop-Shoulder Shirt. Featuring a relaxed fit and unique acid-wash patterns, it's the ultimate streetwear staple.",
    images: [{ url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80", color: null }],
    variants: [
      { id: "p1_v1", color: "Black", size: "M", price: 990, stock: 15, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80" },
      { id: "p1_v2", color: "Black", size: "L", price: 990, stock: 10, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80" },
    ],
    category: "Shirts",
  },
  {
    id: "p2",
    name: "Classic Overdyed Checkered Shirt",
    basePrice: 1499,
    originalPrice: 2199,
    discountBadge: "-31%",
    description: "A timeless checkered pattern with a modern overdyed finish. Perfect for layering over tees or wearing buttoned up.",
    images: [{ url: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80", color: null }],
    variants: [
      { id: "p2_v1", color: "Red", size: "L", price: 1499, stock: 5, image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80" },
      { id: "p2_v2", color: "Red", size: "XL", price: 1499, stock: 2, image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80" },
    ],
    category: "Shirts",
  },
  {
    id: "p3",
    name: "The Zephyr Plus-Size Linen Pant",
    basePrice: 989,
    originalPrice: 1319,
    discountBadge: "-25%",
    description: "Upgrade your everyday rotation with the The Zephyr Plus-Size Linen Pant, designed specifically for ultimate comfort and an effortless drape in sizes 38 to 42. Crafted from a premium, highly breathable linen fabric, these trousers offer a lightweight feel that doesn't compromise on structure or durability.",
    images: [
      { url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80", color: "Black" },
      { url: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&q=80", color: "Dark-Brown" },
      { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80", color: "Dark-Brown" },
      { url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80", color: "White" }
    ],
    variants: [
      { id: "v1", color: "Black", size: "38", price: 989, stock: 10, image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80" },
      { id: "v2", color: "Black", size: "40", price: 989, stock: 5, image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80" },
      { id: "v3", color: "Black", size: "42", price: 1050, stock: 2, image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80" }, 
      { id: "v4", color: "Dark-Brown", size: "38", price: 989, stock: 8, image: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&q=80" },
      { id: "v5", color: "Dark-Brown", size: "40", price: 989, stock: 0, image: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&q=80" },
      { id: "v6", color: "Dark-Brown", size: "42", price: 1050, stock: 5, image: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&q=80" },
      { id: "v7", color: "White", size: "38", price: 1100, stock: 12, image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80" },
      { id: "v8", color: "White", size: "40", price: 1100, stock: 7, image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80" },
      { id: "v9", color: "White", size: "42", price: 1150, stock: 3, image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80" },
    ],
    category: "Bottoms",
  }
];

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [compareToast, setCompareToast] = useState<string | null>(null);
  const { addItem: addCompare, removeItem: removeCompare, hasItem } = useCompareStore();

  const handleCompareToggle = () => {
    if (!product) return;
    if (hasItem(product.id)) {
      removeCompare(product.id);
      setCompareToast("Removed from comparison");
    } else {
      const success = addCompare({
        id: product.id,
        name: product.name,
        imageUrl: selectedImage || product.images?.[0]?.url || "",
        price: product.basePrice,
        originalPrice: product.originalPrice,
        category: product.category,
      });
      if (!success) {
        setCompareToast("Max 3 products! Remove one to continue.");
      } else {
        setCompareToast("Added to comparison ✓");
      }
    }
    setTimeout(() => setCompareToast(null), 2500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCompareToast("Link copied!");
      setTimeout(() => setCompareToast(null), 2000);
    }
  };

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      const supabase = createClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
      
      let query = supabase
        .from("products")
        .select(`
          *,
          categories(id, name),
          product_images(*),
          product_variants(*)
        `);

      if (isUuid) {
        query = query.eq("id", params.id);
      } else {
        query = query.eq("slug", params.id);
      }

      const { data } = await query.single();

      if (data) {
        // Map Supabase DB structure to product format
        const imgs = data.product_images && data.product_images.length > 0 
          ? data.product_images.map((i: any) => ({ url: i.url, color: i.color, is_primary: i.is_primary })) 
          : [{ url: "/placeholder.jpg", color: null, is_primary: true }];
        
        const vars = data.product_variants?.map((v: any) => ({
          id: v.id,
          color: v.color,
          size: v.size,
          price: v.price_override || data.base_price,
          stock: v.stock_quantity,
          image: v.image_url || imgs[0]?.url,
        })) || [];

        const formatted = {
          id: data.id,
          name: data.name,
          basePrice: data.base_price,
          originalPrice: data.compare_at_price || data.base_price,
          discountBadge: data.discount_badge || "",
          description: data.description,
          images: imgs,
          variants: vars,
          category: data.categories?.name || "Apparel",
        };
        setProduct(formatted);
        if (vars.length > 0) {
          const primaryImage = imgs.find((img: any) => img.is_primary);
          const initialColor = primaryImage?.color || vars[0].color;
          setSelectedColor(initialColor);
          setSelectedSize(vars.find((v: any) => v.color === initialColor)?.size || vars[0].size);
          const initialColorImage = imgs.find((img: any) => img.color === initialColor);
          setSelectedImage(initialColorImage?.url || imgs[0]?.url);
        } else {
          setSelectedImage(imgs[0]?.url);
        }

        // Fetch related products
        if (data.categories?.id) {
          const { data: relatedData } = await supabase
            .from('products')
            .select(`
              id, name, slug, base_price, compare_at_price, discount_badge,
              product_images(url, is_primary, color),
              product_variants(color, size, image_url)
            `)
            .eq('category_id', data.categories.id)
            .eq('status', 'active')
            .neq('id', data.id)
            .limit(4);

          if (relatedData) {
            const formattedRelated = relatedData.map(p => {
              const primaryImg = p.product_images?.find((img: any) => img.is_primary)?.url || p.product_images?.[0]?.url || '/placeholder.jpg';
              const discountPct = p.compare_at_price ? Math.round(((p.compare_at_price - p.base_price) / p.compare_at_price) * 100) : 0;
              const uniqueColors = Array.from(new Set(p.product_variants?.map((v: any) => v.color).filter(Boolean)));
              const variantImages = uniqueColors.map((color: any) => {
                const colorImg = p.product_images?.find((img: any) => img.color === color);
                const variantImg = p.product_variants?.find((v: any) => v.color === color)?.image_url;
                return colorImg?.url || variantImg;
              }).filter(Boolean);

              return {
                id: p.id,
                name: p.name,
                originalPrice: p.compare_at_price || p.base_price,
                discountedPrice: p.base_price,
                discountPercentage: discountPct,
                imageUrl: primaryImg,
                variants: variantImages
              };
            });
            setRelatedProducts(formattedRelated);
          }
        }
      } else {
        // Fallback to mock product
        const fallback = mockDatabase.find((p) => p.id === params.id) || mockDatabase[2];
        setProduct(fallback);
        if (fallback.variants.length > 0) {
          const initialColor = fallback.variants[0].color;
          setSelectedColor(initialColor);
          setSelectedSize(fallback.variants[0].size);
          const initialColorImage = fallback.images.find((img: any) => img.color === initialColor);
          setSelectedImage(initialColorImage?.url || fallback.images[0]?.url);
        } else {
          setSelectedImage(fallback.images[0]?.url);
        }
        
        // mock related
        const mockRelated = mockDatabase.filter(p => p.id !== fallback.id).slice(0, 4).map(p => {
          const uniqueColors = Array.from(new Set(p.variants.map((v: any) => v.color).filter(Boolean)));
          const variantImages = uniqueColors.map((color: any) => {
             const variantImg = p.variants.find((v: any) => v.color === color)?.image;
             return variantImg;
          }).filter(Boolean);
          return {
            id: p.id,
            name: p.name,
            originalPrice: p.originalPrice,
            discountedPrice: p.basePrice,
            discountPercentage: Math.round(((p.originalPrice - p.basePrice) / p.originalPrice) * 100),
            imageUrl: p.images[0]?.url,
            variants: variantImages
          }
        });
        setRelatedProducts(mockRelated);
      }
      setLoading(false);
    }

    loadProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!product) return null;

  // Compute available colors and sizes
  const uniqueColorNames = Array.from(new Set(product.variants.map((v: any) => v.color)));
  const availableColors = uniqueColorNames.map((colorName: any) => {
    const v = product.variants.find((v: any) => v.color === colorName);
    const colorSpecificImage = product.images.find((img: any) => img.color === colorName);
    return { name: colorName, image: colorSpecificImage?.url || v?.image || product.images[0]?.url };
  });
  
  // Show all unique sizes so the buttons don't disappear, stock will be checked via activeVariant
  const availableSizes = Array.from(new Set(product.variants.map((v: any) => v.size)));

  const activeVariant = product.variants.find(
    (v: any) => v.color === selectedColor && v.size === selectedSize
  );

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const colorVariant = product.variants.find((v: any) => v.color === color);
    const colorSpecificImage = product.images.find((img: any) => img.color === color);
    
    if (colorSpecificImage) {
      setSelectedImage(colorSpecificImage.url);
    } else if (colorVariant?.image) {
      setSelectedImage(colorVariant.image);
    }

    if (colorVariant) {
      setSelectedSize(colorVariant.size);
    }
  };

  // Determine which images to show in the gallery
  const galleryImages = product.images.filter((img: any) => !img.color || img.color === selectedColor);

  return (
    <>
      <main className="min-h-screen bg-white text-black font-sans pb-24 overflow-x-hidden">
      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 text-xs text-gray-500 uppercase tracking-widest flex items-center gap-2">
        <a href="/" className="hover:text-black">Home</a>
        <span>/</span>
        <a href={`/shop/${product.category.toLowerCase()}`} className="hover:text-black">{product.category}</a>
        <span>/</span>
        <span className="text-black font-medium line-clamp-1">{product.name}</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-16 items-start">
          
          {/* Left Column: Image Gallery (7 cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-4 lg:sticky lg:top-24">
            {/* Thumbnails list */}
            {galleryImages.length > 0 && (
              <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto no-scrollbar lg:max-h-[650px] flex-shrink-0 w-full lg:w-20 snap-x">
                {galleryImages.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img.url)}
                    className={`relative w-20 lg:w-20 h-24 border-2 transition-all flex-shrink-0 bg-gray-50 overflow-hidden snap-start ${
                      selectedImage === img.url ? "border-black scale-95" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Display */}
            <div 
              className="flex-1 relative aspect-[3/4] bg-gray-50 overflow-hidden group w-full cursor-zoom-in"
              onClick={() => setIsZoomOpen(true)}
            >
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                 <div className="bg-white/90 text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all">
                   <MousePointer2 className="w-4 h-4" /> Click to Zoom
                 </div>
              </div>
              {product.discountBadge && (
                <span className="absolute top-4 left-4 bg-black text-white text-xs font-bold px-3 py-1 uppercase tracking-widest z-10">
                  {product.discountBadge}
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Product Info & Form (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-wide uppercase text-gray-900 leading-tight mb-2">
              {product.name}
            </h1>
            
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl font-bold text-black">
                Rs.{activeVariant ? activeVariant.price : product.basePrice}
              </span>
              {product.originalPrice > (activeVariant ? activeVariant.price : product.basePrice) && (
                <span className="text-base text-gray-400 line-through">
                  Rs.{product.originalPrice}
                </span>
              )}
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              {product.description}
            </p>

              <ProductForm 
                product={product} 
                availableColors={availableColors as any[]}
                availableSizes={availableSizes as string[]}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
                onColorSelect={handleColorChange}
                onSizeSelect={setSelectedSize}
                currentVariant={activeVariant}
                category={product.category}
              />

              {/* Compare + Share row */}
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={handleCompareToggle}
                  className={`flex items-center gap-2 px-4 py-2.5 border text-sm font-semibold uppercase tracking-widest transition-all ${
                    hasItem(product.id)
                      ? "border-black bg-black text-white"
                      : "border-gray-300 text-black hover:border-black"
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  {hasItem(product.id) ? "✓ Comparing" : "Compare"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-sm font-semibold uppercase tracking-widest hover:border-black transition-all text-black"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>

              {/* Toast feedback */}
              {compareToast && (
                <div className="mt-2 text-xs font-semibold text-black bg-gray-50 border border-gray-200 px-3 py-2 rounded-sm">
                  {compareToast}
                </div>
              )}

            {/* Accordion Details */}
            <div className="mt-12 border-t border-gray-100 divide-y divide-gray-100">
              <details className="group py-5" open>
                <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-widest cursor-pointer list-none">
                  Product Details
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="text-gray-500 text-sm mt-4 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </div>
              </details>
              
              <details className="group py-5">
                <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-widest cursor-pointer list-none">
                  Delivery &amp; Returns
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="text-gray-500 text-sm mt-4 leading-relaxed">
                  Delivery within 5-7 business days. Easy 7-day returns on unworn items with tags attached.
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 border-t border-gray-100 pt-16">
            <h2 className="text-xl md:text-2xl font-medium tracking-wide text-center mb-10 text-black">Related Products</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {relatedProducts.map(relatedProd => (
                <ProductCard
                  key={relatedProd.id}
                  id={relatedProd.id}
                  name={relatedProd.name}
                  imageUrl={relatedProd.imageUrl}
                  originalPrice={relatedProd.originalPrice}
                  discountedPrice={relatedProd.discountedPrice}
                  discountPercentage={relatedProd.discountPercentage}
                  variants={relatedProd.variants}
                />
              ))}
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Image Zoom Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center overflow-hidden">
          {/* Top Controls */}
          <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex gap-4">
              <button 
                onClick={() => setZoomScale(s => Math.min(s + 0.5, 4))}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
                title="Zoom In"
              >
                <ZoomIn className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setZoomScale(s => Math.max(s - 0.5, 1))}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
                title="Zoom Out"
              >
                <ZoomOut className="w-6 h-6" />
              </button>
            </div>
            <button 
              onClick={() => { setIsZoomOpen(false); setZoomScale(1); }}
              className="p-3 bg-white/10 hover:bg-red-500 hover:text-white text-white rounded-full transition-colors backdrop-blur-sm"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Zoomable Image Container */}
          <div 
            className="w-full h-full overflow-auto flex items-center justify-center p-4 md:p-8 cursor-move no-scrollbar"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsZoomOpen(false);
                setZoomScale(1);
              }
            }}
          >
            <img
              src={selectedImage}
              alt={product.name}
              className="max-w-none transition-transform duration-200 ease-out"
              style={{ 
                transform: `scale(${zoomScale})`,
                width: 'auto',
                height: zoomScale === 1 ? '100%' : 'auto',
                maxHeight: zoomScale === 1 ? '100%' : 'none'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
