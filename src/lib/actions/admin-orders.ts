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
  
  // Get current order status before updating to prevent duplicate stock reduction
  const { data: order } = await admin.from("orders").select("fulfillment_status").eq("id", orderId).single();
  
  const { error } = await admin
    .from("orders")
    .update({ fulfillment_status: status })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Deduct stock if the status is changed to "shipped" AND it wasn't already shipped or delivered
  if (status === "shipped" && order && !["shipped", "delivered"].includes(order.fulfillment_status)) {
    const { data: orderItems } = await admin.from("order_items").select("variant_id, quantity").eq("order_id", orderId);
    if (orderItems) {
      for (const item of orderItems) {
        if (!item.variant_id) continue;
        const { data: variant } = await admin.from("product_variants").select("stock_quantity").eq("id", item.variant_id).single();
        if (variant) {
          await admin.from("product_variants")
            .update({ stock_quantity: Math.max(0, (variant.stock_quantity ?? 0) - item.quantity) })
            .eq("id", item.variant_id);
        }
      }
    }
  }

  return { success: true };
}

export async function getPendingOrdersCount() {
  const admin = getSupabaseAdmin();
  const { count, error } = await admin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .in("fulfillment_status", ["pending", "processing"]);
    
  if (error) {
    return 0;
  }
  return count || 0;
}
