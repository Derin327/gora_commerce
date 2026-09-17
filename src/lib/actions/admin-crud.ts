"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// ── Server Supabase client (uses anon key + session cookie) ──────
function getSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { cookieStore.set(name, value, options); },
        remove(name: string, options: CookieOptions) { cookieStore.set(name, "", options); },
      },
    }
  );
}

// ── Guard: ensure caller is admin ────────────────────────────────
async function requireAdmin() {
  const supabase = getSupabase();
  // For server actions performing mutations, we DO use getUser() to ensure
  // the token is absolutely fresh and hasn't been revoked at the Auth server.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    throw new Error("Forbidden");
  }

  return supabase;
}

// ════════════════════════════════════════════════════════════════
// CATEGORIES
// ════════════════════════════════════════════════════════════════

export async function getCategories() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function createCategory(formData: {
  name: string;
  slug: string;
  description: string;
  image_url: string;
}) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("categories").insert(formData);
  if (error) return { success: false, error: error.message };
  revalidatePath("/manager-gora/categories");
  return { success: true };
}

export async function updateCategory(id: string, formData: {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
}) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("categories").update(formData).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/manager-gora/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await requireAdmin();
  // Check if category has products first
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);
  if (count && count > 0) {
    return { success: false, error: `Cannot delete: ${count} product(s) still use this category. Reassign them first.` };
  }
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/manager-gora/categories");
  return { success: true };
}

// ════════════════════════════════════════════════════════════════
// PRODUCTS
// ════════════════════════════════════════════════════════════════

export async function getAdminProducts(filters?: { search?: string; status?: string; category?: string }) {
  const supabase = await requireAdmin();
  let query = supabase
    .from("products")
    .select(`
      id, name, slug, base_price, compare_at_price, status, is_featured, created_at,
      categories(name),
      product_images(url, is_primary),
      product_variants(stock_quantity)
    `)
    .order("created_at", { ascending: false });

  if (filters?.search) query = query.ilike("name", `%${filters.search}%`);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.category) query = query.eq("category_id", filters.category);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getAdminProduct(id: string) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories(id, name),
      product_images(*),
      product_variants(*)
    `)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateProduct(id: string, formData: {
  name: string;
  slug: string;
  description: string;
  category_id: string;
  base_price: number;
  compare_at_price: number | null;
  status: string;
  discount_badge: string;
  is_featured: boolean;
}) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").update(formData).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/manager-gora/products");
  return { success: true };
}

export async function updateProductStatus(id: string, status: "draft" | "active" | "archived") {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").update({ status }).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/manager-gora/products");
  return { success: true };
}

export async function toggleSpecialOffer(id: string, is_featured: boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").update({ is_featured }).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/manager-gora/products");
  revalidatePath("/offers");
  revalidatePath("/");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();
  // Cascade deletes variants + images via FK
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/manager-gora/products");
  return { success: true };
}

// ════════════════════════════════════════════════════════════════
// STOREFRONT CMS
// ════════════════════════════════════════════════════════════════

export async function getStorefrontComponents() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("storefront_components")
    .select("*")
    .order("display_order");
  if (error) throw new Error(error.message);
  return data;
}

export async function upsertStorefrontComponent(component_type: string, config: Record<string, any>, is_active: boolean, display_order: number) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("storefront_components")
    .upsert({ component_type, config, is_active, display_order }, { onConflict: "component_type" });
  if (error) return { success: false, error: error.message };
  revalidatePath("/");
  revalidatePath("/manager-gora/storefront");
  return { success: true };
}

