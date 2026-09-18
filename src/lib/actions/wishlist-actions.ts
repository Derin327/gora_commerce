"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getSupabaseServer() {
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

// Bypasses RLS strictly for product reads safely
function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function getUserWishlistIds() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, ids: [] };

  const { data, error } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", user.id);

  if (error) return { success: false, ids: [] };
  return { success: true, ids: data.map(d => d.product_id) };
}

export async function getFullWishlistProducts() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, products: [] };

  const { data: wishlists, error: wError } = await supabase
    .from("wishlists")
    .select("product_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (wError || !wishlists || wishlists.length === 0) return { success: true, products: [] };

  const productIds = wishlists.map(w => w.product_id);

  const admin = getSupabaseAdmin();
  const { data: products, error: pError } = await admin
    .from("products")
    .select("*, product_images(*), product_variants(*), categories(name)")
    .in("id", productIds);

  if (pError) return { success: false, products: [] };

  // Sort products to match wishlist order
  const sortedProducts = products.sort((a, b) => 
    productIds.indexOf(a.id) - productIds.indexOf(b.id)
  );

  return { success: true, products: sortedProducts };
}

export async function toggleWishlist(productId: string) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "Not logged in", requiresAuth: true };
  }

  // Check if it exists
  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .single();

  if (existing) {
    // Remove
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", existing.id);
    
    if (error) return { success: false, error: error.message };
  } else {
    // Add
    const { error } = await supabase
      .from("wishlists")
      .insert({
        user_id: user.id,
        product_id: productId,
      });
      
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/wishlist");
  return { success: true, isWishlisted: !existing };
}
