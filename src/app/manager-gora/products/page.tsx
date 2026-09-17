"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Eye, EyeOff, Loader2, Package, ChevronUp, ChevronDown, Tag } from "lucide-react";
import { getAdminProducts, getCategories, updateProductStatus, deleteProduct, toggleSpecialOffer } from "@/lib/actions/admin-crud";

const STATUS_STYLES: Record<string, string> = {
  active:   "bg-green-100 text-green-700",
  draft:    "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-500",
};

export default function AdminProductsPage() {
  const [products, setProducts]     = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = () => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const [prods, cats] = await Promise.all([
          getAdminProducts({ search, status: statusFilter, category: categoryFilter }),
          getCategories(),
        ]);
        setProducts(prods ?? []);
        setCategories(cats ?? []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    });
  };

  useEffect(() => { load(); }, [search, statusFilter, categoryFilter]);

  const handleStatusToggle = async (id: string, current: string) => {
    const next = current === "active" ? "draft" : "active";
    await updateProductStatus(id, next as any);
    load();
  };

  const handleSpecialOfferToggle = async (id: string, current: boolean) => {
    await toggleSpecialOffer(id, !current);
    load();
  };

  const handleDelete = async (id: string) => {
    const result = await deleteProduct(id);
    if (!result.success) { setError(result.error || "Delete failed"); return; }
    setConfirmDelete(null);
    load();
  };

  const totalStock = (variants: any[]) =>
    variants?.reduce((s: number, v: any) => s + (v.stock_quantity || 0), 0) ?? 0;

  const primaryImage = (images: any[]) =>
    images?.find((i: any) => i.is_primary)?.url ?? images?.[0]?.url ?? null;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} product{products.length !== 1 ? "s" : ""} in catalog</p>
        </div>
        <Link
          href="/manager-gora/products/new"
          className="bg-black text-white px-4 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 border border-gray-200 rounded-t-lg flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-black"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-black"
        >
          <option value="">All Categories</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-center">Stock</th><th className="px-4 py-3 text-center">Special Offer</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-500">No products found</p>
                  <Link href="/manager-gora/products/new" className="text-sm text-black underline mt-2 block">
                    Add your first product →
                  </Link>
                </td>
              </tr>
            ) : (
              products.map((p: any) => {
                const stock = totalStock(p.product_variants);
                const img = primaryImage(p.product_images);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                          {img ? (
                            <img src={img} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900 line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_STYLES[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.categories?.name ?? <span className="text-gray-300 italic">None</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-bold text-gray-900">Rs.{p.base_price}</p>
                      {p.compare_at_price && (
                        <p className="text-xs text-gray-400 line-through">Rs.{p.compare_at_price}</p>
                      )}
                    </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-bold ${stock === 0 ? "text-red-500" : stock < 5 ? "text-orange-500" : "text-gray-700"}`}>
                      {stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleSpecialOfferToggle(p.id, p.is_featured)}
                      title={p.is_featured ? "Remove from Special Offers" : "Mark as Special Offer"}
                      className={`p-2 rounded-md transition-colors ${p.is_featured ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                  </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Toggle active/draft */}
                        <button
                          onClick={() => handleStatusToggle(p.id, p.status)}
                          title={p.status === "active" ? "Set to Draft" : "Set to Active"}
                          className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
                        >
                          {p.status === "active" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {/* Edit */}
                        <Link
                          href={`/manager-gora/products/${p.id}`}
                          className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        {/* Delete */}
                        <button
                          onClick={() => setConfirmDelete(p.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg mb-2">Delete Product?</h3>
            <p className="text-sm text-gray-500 mb-6">This will permanently delete the product and all its variants and images. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition-colors"
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

