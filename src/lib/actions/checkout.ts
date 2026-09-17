"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Standard client to verify the user's secure session
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

// Admin client to safely bypass RLS for server-side order processing
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function generateOrderNumber() {
  return `ORD-${Math.floor(10000000 + Math.random() * 90000000)}`;
}

export async function createOrder(data: {
  items: Array<{
    id: string; // variant id
    productId: string;
    name: string;
    color?: string;
    size?: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  shippingInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}) {
  const supabase = getSupabase();
  const admin = getSupabaseAdmin(); // Used for trusted backend operations

  // 1. Authenticate user securely via JWT
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to place an order." };
  }

  // 1b. Automatically save/update the user's profile with this shipping data
  await admin.from("profiles").upsert({
    id: user.id,
    phone: data.shippingInfo.phone,
    address: data.shippingInfo.address,
    city: data.shippingInfo.city,
    pincode: data.shippingInfo.pincode,
    updated_at: new Date().toISOString()
  });

  try {
    let secureSubtotal = 0;
    const finalOrderItems = [];

    // 2. Validate prices and stock against the true database values (Security!)
    for (const item of data.items) {
      const { data: dbVariant } = await admin
        .from("product_variants")
        .select("*, products(name, base_price)")
        .eq("id", item.id)
        .single();

      if (!dbVariant) {
        return { error: `Product variant not found for ${item.name}` };
      }

      if ((dbVariant.stock_quantity ?? 0) < item.quantity) {
        return { error: `Not enough stock for ${item.name}. Only ${dbVariant.stock_quantity ?? 0} left.` };
      }

      // Use variant price_override if set, otherwise fall back to product base_price
      const securePrice = dbVariant.price_override ?? dbVariant.products.base_price;
      const itemTotal = securePrice * item.quantity;
      secureSubtotal += itemTotal;

      finalOrderItems.push({
        product_id: item.productId,
        variant_id: item.id,
        product_name: dbVariant.products.name,
        color: dbVariant.color || null,
        size: dbVariant.size || null,
        unit_price: securePrice,
        quantity: item.quantity,
        total_price: itemTotal,
        image_url: item.image,
      });
    }

    const shippingFee = secureSubtotal > 2000 ? 0 : 100;
    const totalAmount = secureSubtotal + shippingFee;
    const orderNumber = generateOrderNumber();

    // 3. Insert Order safely bypassing RLS
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        customer_name: data.shippingInfo.fullName,
        customer_email: data.shippingInfo.email,
        customer_phone: data.shippingInfo.phone,
        shipping_address: {
          address: data.shippingInfo.address,
          city: data.shippingInfo.city,
          state: data.shippingInfo.state,
          pincode: data.shippingInfo.pincode,
        },
        subtotal: secureSubtotal,
        shipping_fee: shippingFee,
        total_amount: totalAmount,
        payment_method: "cod",
        payment_status: "pending",
        fulfillment_status: "processing",
      })
      .select("id")
      .single();

    if (orderError || !order) throw new Error(orderError?.message || "Failed to create order");

    // 4. Insert Order Items safely
    const itemsToInsert = finalOrderItems.map(i => ({ ...i, order_id: order.id }));
    const { error: itemsError } = await admin.from("order_items").insert(itemsToInsert);
    if (itemsError) throw new Error(itemsError.message);

    // 5. Decrement Stock securely
    for (const item of finalOrderItems) {
      const { data: variant } = await admin.from("product_variants").select("stock_quantity").eq("id", item.variant_id).single();
      if (variant) {
        await admin.from("product_variants").update({ stock_quantity: (variant.stock_quantity ?? 0) - item.quantity }).eq("id", item.variant_id);
      }
    }

    return { success: true, orderId: order.id, orderNumber };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

