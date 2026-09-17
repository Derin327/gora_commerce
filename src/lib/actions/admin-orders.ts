"use server";

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function getAdminOrders() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        product_variants (
          sku
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin orders:", error);
    return [];
  }
  return data || [];
}

export async function updateOrderStatus(orderId: string, status: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("orders")
    .update({ fulfillment_status: status })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
