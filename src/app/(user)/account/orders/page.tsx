"use client";

import { useState, useEffect } from "react";
import { Package, ChevronRight, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

type FulfillmentStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

const STATUS_CONFIG: Record<FulfillmentStatus, { dot: string; text: string; bg: string; border: string }> = {
  pending:    { dot: "bg-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  processing: { dot: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200" },
  shipped:    { dot: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  delivered:  { dot: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50",  border: "border-green-200" },
  cancelled:  { dot: "bg-red-500",    text: "text-red-600",    bg: "bg-red-50",    border: "border-red-200" },
};

function StatusBadge({ status }: { status: string }) {
  const s = (status || "pending") as FulfillmentStatus;
  const c = STATUS_CONFIG[s] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {s}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("orders")
        .select(`
          id, order_number, created_at, total_amount,
          fulfillment_status, payment_status,
          order_items ( id, product_name, image_url, quantity )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setOrders(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 shadow-sm p-12 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-100 shadow-sm px-5 md:px-7 py-5 flex items-center gap-3">
        <Package className="w-5 h-5 text-black" />
        <h1 className="text-base font-bold uppercase tracking-widest text-black">My Orders</h1>
        {orders.length > 0 && (
          <span className="ml-auto text-xs font-semibold text-gray-400">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-100 shadow-sm p-12 text-center">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">No orders yet</p>
          <p className="text-xs text-gray-400 mb-6">Your orders will appear here once you make a purchase.</p>
          <Link href="/" className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors inline-flex items-center gap-2">
            Start Shopping <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const date = new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric"
            });
            const previewItems = (order.order_items || []).slice(0, 3);

            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block bg-white border border-gray-100 shadow-sm hover:border-gray-300 hover:shadow-md transition-all group"
              >
                {/* Order top row */}
                <div className="px-5 md:px-7 py-4 flex items-center justify-between gap-4 border-b border-gray-50">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order</p>
                      <p className="text-sm font-bold text-black">{order.order_number}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Placed</p>
                      <p className="text-sm font-semibold text-black">{date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                      <p className="text-sm font-bold text-black">Rs.{order.total_amount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={order.fulfillment_status} />
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Product thumbnail strip */}
                <div className="px-5 md:px-7 py-3.5 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {previewItems.map((item: any) => (
                      <div key={item.id} className="relative">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-12 h-14 object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-12 h-14 bg-gray-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                        {item.quantity > 1 && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                    ))}
                    {order.order_items?.length > 3 && (
                      <div className="w-12 h-14 bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-400">+{order.order_items.length - 3}</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-2 flex-1 min-w-0">
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {previewItems.map((i: any) => i.product_name).join(", ")}
                      {order.order_items?.length > 3 && ` and ${order.order_items.length - 3} more`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.order_items?.length} item{order.order_items?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-black uppercase tracking-wider hidden sm:block group-hover:underline">
                    View Details
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
