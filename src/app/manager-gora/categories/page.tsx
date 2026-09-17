"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Pencil, Trash2, Loader2, Check, X, FolderOpen, ToggleLeft, ToggleRight, Upload } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/actions/admin-crud";
import { uploadMediaAction } from "@/lib/actions/upload-media";
import ImageCropper from "@/components/admin/ImageCropper";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
  products: { count: number }[];
}

const emptyForm = { name: "", slug: "", description: "", image_url: "", is_active: true };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Category | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const load = () => {
    startTransition(async () => {
      setIsLoading(true);
      try {
        const data = await getCategories();
        setCategories(data ?? []);
      } catch (e: any) { setError(e.message); }
      finally { setIsLoading(false); }
    });
  };

  useEffect(() => { load(); }, []);

  // Auto-slug from name
  const handleNameChange = (val: string) => {
    setForm(f => ({
      ...f,
      name: val,
      slug: editing ? f.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    }));
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); setError(null); };
  const openEdit   = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", image_url: cat.image_url || "", is_active: cat.is_active });
    setShowForm(true);
    setError(null);
  };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    setCropImageSrc(url);
    setIsCropping(true);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedFile: File, _meta: any) => {
    setIsCropping(false);
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", croppedFile);
      const res = await uploadMediaAction(formData);
      if (res.success && "url" in res && res.url) {
        const uploadedUrl = res.url as string;
        setForm({ ...form, image_url: uploadedUrl });
        alert("Upload successful!\nURL: " + uploadedUrl);
      } else {
        const errMsg = ("error" in res && res.error) ? res.error : "Failed to upload image.";
        setError(errMsg);
        alert("Upload Error: " + errMsg);
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
      alert("Upload Exception: " + err.message);
    } finally {
      setIsUploading(false);
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = editing
        ? await updateCategory(editing.id, form)
        : await createCategory(form);
      if (!result.success) { setError(result.error || "Failed"); return; }
      setShowForm(false);
      load();
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    startTransition(async () => {
      const result = await deleteCategory(confirmDelete.id);
      if (!result.success) { setError(result.error || "Delete failed"); setConfirmDelete(null); return; }
      setConfirmDelete(null);
      load();
    });
  };

  const productCount = (cat: Category) => cat.products?.[0]?.count ?? 0;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Organise your products into browsable sections.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-black text-white px-4 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6 text-sm">{error}</div>
      )}

      {/* Category Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FolderOpen className="w-12 h-12 mb-3" />
          <p className="text-sm font-semibold">No categories yet</p>
          <button onClick={openCreate} className="text-sm text-black underline mt-2">Create your first category</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className={`bg-white border rounded-lg overflow-hidden shadow-sm transition-all ${!cat.is_active ? "opacity-60" : ""}`}>
              {/* Image */}
              <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <FolderOpen className="w-10 h-10" />
                  </div>
                )}
                {!cat.is_active && (
                  <span className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded font-semibold">Hidden</span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">/{cat.slug}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {productCount(cat)} product{productCount(cat) !== 1 ? "s" : ""}
                  </span>
                </div>
                {cat.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{cat.description}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => openEdit(cat)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => updateCategory(cat.id, { ...cat, is_active: !cat.is_active }).then(load)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    {cat.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                    {cat.is_active ? "Active" : "Hidden"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(cat)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Slide-over */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-bold">{editing ? "Edit Category" : "New Category"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5">
              {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">{error}</div>}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Category Name *</label>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Shirts & Tops"
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Slug *</label>
                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden focus-within:border-black transition-colors">
                  <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r">/shop/</span>
                  <input
                    type="text" required value={form.slug}
                    onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="shirts-tops"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Description</label>
                <textarea
                  rows={3} value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description shown on category page..."
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Cover Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url" value={form.image_url}
                    onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1 border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors rounded-md"
                  />
                  <label className="bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-semibold cursor-pointer hover:bg-gray-200 transition flex items-center justify-center min-w-[120px]">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Upload</>}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={isUploading} />
                  </label>
                </div>
                {form.image_url && (
                  <div className="mt-2 h-24 rounded-md overflow-hidden bg-gray-100">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-black"
                />
                <span className="text-sm font-semibold text-gray-700">Visible on storefront</span>
              </label>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 px-4 py-2.5 bg-black text-white rounded-md text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? "Save Changes" : "Create Category"}
                </button>
              </div>
            
          {isCropping && cropImageSrc && (
            <ImageCropper
              imageSrc={cropImageSrc}
              aspectRatio={3 / 4}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          )}
        </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg mb-1">Delete "{confirmDelete.name}"?</h3>
            <p className="text-sm text-gray-500 mb-1">
              {productCount(confirmDelete) > 0
                ? `âš ï¸ This category has ${productCount(confirmDelete)} product(s). You must reassign them before deleting.`
                : "This cannot be undone."}
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border rounded-md text-sm font-semibold">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={productCount(confirmDelete) > 0}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



