"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { createProductAction } from "@/lib/actions/admin-products";
import ImageCropper from "@/components/admin/ImageCropper";
import { Upload, X, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { CATEGORY_HIERARCHY } from "@/lib/constants";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Variant {
  sku: string;
  color: string;
  size: string;
  price_override: number | null;
  stock_quantity: number;
  image_url: string | null;
}

interface ProductImage {
  id: string;
  file: File;
  preview: string;
  is_primary: boolean;
  width: number;
  height: number;
  aspect_ratio: string;
    color_variant?: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createClient();

  // Basic Details
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [status, setStatus] = useState("draft");
    const [discountBadge, setDiscountBadge] = useState("");

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const availableSubcategories = selectedCategoryObj?.slug ? CATEGORY_HIERARCHY[selectedCategoryObj.slug] || [] : [];

  // Variants
  const [variants, setVariants] = useState<Variant[]>([]);

  // Images & Cropping
  const [images, setImages] = useState<ProductImage[]>([]);
  const [pendingCropFiles, setPendingCropFiles] = useState<{ url: string; file: File }[]>([]);
  const [isCropping, setIsCropping] = useState(false);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from("categories").select("id, name, slug").eq("is_active", true);
      if (data) setCategories(data);
    }
    fetchCategories();
  }, [supabase]);

  // Handle Slug Generation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
  };

  // --- Variants Management ---
  const addVariant = () => {
    setVariants([
      ...variants,
      { sku: "", color: "", size: "", price_override: null, stock_quantity: 0, image_url: null },
    ]);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // --- Image Upload & Cropping ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newPending = files.map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));
      setPendingCropFiles((prev) => [...prev, ...newPending]);
      setIsCropping(true);
    }
    // Reset input
    e.target.value = '';
  };

  const handleCropComplete = (croppedFile: File, meta: { width: number; height: number; aspect_ratio: string }) => {
    const newImage: ProductImage = {
      id: crypto.randomUUID(),
      file: croppedFile,
      preview: URL.createObjectURL(croppedFile),
      is_primary: images.length === 0, // First image is primary
      width: meta.width,
      height: meta.height,
      aspect_ratio: meta.aspect_ratio,
    };

    setImages((prev) => [...prev, newImage]);
    
    // Move to next image or close cropper
    const remaining = pendingCropFiles.slice(1);
    setPendingCropFiles(remaining);
    if (remaining.length === 0) {
      setIsCropping(false);
    }
  };

  const cancelCrop = () => {
    const remaining = pendingCropFiles.slice(1);
    setPendingCropFiles(remaining);
    if (remaining.length === 0) {
      setIsCropping(false);
    }
  };

  const removeImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const setImageColorVariant = (id: string, color: string) => {
    setImages(images.map((img) => img.id === id ? { ...img, color_variant: color } : img));
  };

  const setPrimaryImage = (id: string) => {
    setImages(images.map((img) => ({ ...img, is_primary: img.id === id })));
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name || !slug || !basePrice || !categoryId) {
      setError("Please fill in all required basic fields.");
      return;
    }
    if (variants.length === 0) {
      setError("Please add at least one variant (e.g. Size/Color).");
      return;
    }
    if (images.length === 0) {
      setError("Please upload at least one image.");
      return;
    }

    // Check duplicate color/size
    const comboSet = new Set();
    for (const v of variants) {
      const key = `${v.color}-${v.size}`;
      if (comboSet.has(key)) {
        setError(`Duplicate variant found: ${v.color} - ${v.size}`);
        return;
      }
      comboSet.add(key);
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("description", description);
      formData.append("category_id", categoryId);
      if (subcategory) formData.append("subcategory", subcategory);
      formData.append("base_price", basePrice);
      if (comparePrice) formData.append("compare_at_price", comparePrice);
      formData.append("status", status);
      if (discountBadge) formData.append("discount_badge", discountBadge);
      
      formData.append("variants", JSON.stringify(variants));

      const imagesMeta = images.map((img, idx) => ({
        storage_key: `products/${crypto.randomUUID()}/original_${idx}.webp`,
        url: "", // The server action will know the R2 domain
        alt_text: `${name} - Image ${idx + 1}` + (img.color_variant ? `|color:${img.color_variant}` : ""),
        color: img.color_variant,
        width: img.width,
        height: img.height,
        aspect_ratio: img.aspect_ratio,
        is_primary: img.is_primary,
        display_order: idx
      }));

      formData.append("imagesMeta", JSON.stringify(imagesMeta));
      
      images.forEach((img) => {
        formData.append("images", img.file);
      });

      const result = await createProductAction(formData);

      if (result.success) {
        router.push("/manager-gora/products");
      } else {
        setError(result.error || "Failed to create product");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new product, configure variants, and upload cropped images.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Details */}
        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm space-y-6">
          <h2 className="text-lg font-bold border-b pb-2">Basic Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name *</label>
              <input type="text" required value={name} onChange={handleNameChange} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Slug *</label>
              <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-gray-50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>
        </div>

        {/* Pricing & Classification */}
        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm space-y-6">
          <h2 className="text-lg font-bold border-b pb-2">Pricing & Organization</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Base Price (Rs) *</label>
              <input type="number" required min="0" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Compare-at Price</label>
              <input type="number" min="0" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
              <select required value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategory(""); }} className="w-full px-3 py-2 border rounded-md bg-white">
                <option value="">Select a category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Subcategory</label>
              <select 
                value={subcategory} 
                onChange={(e) => setSubcategory(e.target.value)} 
                disabled={availableSubcategories.length === 0} 
                className="w-full px-3 py-2 border rounded-md bg-white disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">{availableSubcategories.length === 0 ? "N/A" : "Select a subcategory"}</option>
                {availableSubcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-white">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-bold">Product Images *</h2>
            <label className="bg-black text-white px-3 py-1.5 rounded-md text-sm font-semibold cursor-pointer hover:bg-gray-800 transition-colors">
              <span className="flex items-center gap-2"><Upload className="w-4 h-4"/> Upload Images</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((img) => {
              const uniqueColors = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));
              return (
                <div key={img.id} className="flex flex-col gap-2">
                  <div className={`relative aspect-[3/4] border-2 rounded-lg overflow-hidden group ${img.is_primary ? 'border-black' : 'border-gray-200'}`}>
                    <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex justify-end">
                        <button type="button" onClick={() => removeImage(img.id)} className="p-1 bg-white rounded-full text-red-600 hover:bg-red-50">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {!img.is_primary && (
                        <button type="button" onClick={() => setPrimaryImage(img.id)} className="w-full py-1 bg-white text-black text-xs font-bold rounded">
                          Set Primary
                        </button>
                      )}
                    </div>
                    {img.is_primary && (
                      <div className="absolute top-2 left-2 bg-black text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">PRIMARY</div>
                    )}
                  </div>
                  <select
                    value={img.color_variant || ""}
                    onChange={(e) => setImageColorVariant(img.id, e.target.value)}
                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:outline-none focus:border-black"
                  >
                    <option value="">(All Colors)</option>
                    {uniqueColors.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              );
            })}
            {images.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm">No images uploaded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-bold">Variants & Inventory *</h2>
            <button type="button" onClick={addVariant} className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
              <Plus className="w-4 h-4" /> Add Variant
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-md bg-gray-50 items-end">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Color *</label>
                  <input type="text" required placeholder="e.g. Black" value={variant.color} onChange={(e) => updateVariant(index, 'color', e.target.value)} className="w-full px-2 py-1.5 border rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Size *</label>
                  <input type="text" required placeholder="e.g. M, L, 42" value={variant.size} onChange={(e) => updateVariant(index, 'size', e.target.value)} className="w-full px-2 py-1.5 border rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">SKU</label>
                  <input type="text" placeholder="Unique SKU" value={variant.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} className="w-full px-2 py-1.5 border rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Stock *</label>
                  <input type="number" required min="0" value={variant.stock_quantity} onChange={(e) => updateVariant(index, 'stock_quantity', parseInt(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Price Override</label>
                    <input type="number" placeholder="Base Price" value={variant.price_override || ''} onChange={(e) => updateVariant(index, 'price_override', e.target.value ? parseFloat(e.target.value) : null)} className="w-full px-2 py-1.5 border rounded text-sm" />
                  </div>
                  <button type="button" onClick={() => removeVariant(index)} className="p-2 text-red-500 hover:bg-red-50 rounded mt-5">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {variants.length === 0 && (
              <p className="text-sm text-gray-500 italic">No variants added. A product must have at least one variant.</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-black text-white rounded-md font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saving to Database & R2...</>
            ) : (
              'Create Product'
            )}
          </button>
        </div>
      </form>

      {/* Cropper Modal */}
      {isCropping && pendingCropFiles.length > 0 && (
        <ImageCropper
          imageSrc={pendingCropFiles[0].url}
          aspectRatio={3 / 4}
          onCropComplete={handleCropComplete}
          onCancel={cancelCrop}
        />
      )}
    </div>
  );
}





