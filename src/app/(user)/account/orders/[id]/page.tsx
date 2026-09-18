"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Package, Loader2, CheckCircle,
  Truck, MapPin, CreditCard, Clock
} from "lucide-react";

type Status = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

const STEPS: { key: Status | "confirmed"; label: string; icon: typeof CheckCircle }[] = [
  { key: "pending",    label: "Order Placed",  icon: CheckCircle },
  { key: "confirmed",  label: "Confirmed",     icon: CheckCircle },
  { key: "processing", label: "Processing",    icon: Package },
  { key: "shipped",    label: "Shipped",       icon: Truck },
  { key: "delivered",  label: "Delivered",     icon: CheckCircle },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4
};

function OrderTracker({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-lg font-bold">✕</span>
        </div>
        <div>
          <p className="text-sm font-bold text-red-700 uppercase tracking-wider">Order Cancelled</p>
          <p className="text-xs text-red-500 mt-0.5">This order has been cancelled.</p>
        </div>
      </div>
    );
  }

  const currentStep = STATUS_ORDER[status] ?? 0;

  return (
    <div className="px-5 py-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Order Status</p>
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 hidden sm:block" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-black hidden sm:block transition-all duration-500"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * (100 - (8 / STEPS.length))}%` }}
        />

        <div className="flex flex-col sm:flex-row sm:justify-between gap-6 sm:gap-2 relative z-10">
          {STEPS.map((step, i) => {
            const done = i <= currentStep;
            const active = i === currentStep;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 sm:flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                  done
                    ? "bg-black border-black"
                    : "bg-white border-gray-200"
                }`}>
                  {done
                    ? <Icon className="w-4 h-4 text-white" />
                    : <span className="w-2 h-2 rounded-full bg-gray-200" />}
                </div>
                <div className="sm:text-center">
                  <p className={`text-xs font-bold uppercase tracking-wider ${
                    active ? "text-black" : done ? "text-gray-600" : "text-gray-300"
                  }`}>
                    {step.label}
                  </p>
                  {active && (
                    <p className="text-[10px] text-gray-400 mt-0.5 sm:text-center">Current</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("orders")
        .select(`
          id, order_number, created_at, total_amount, subtotal,
          shipping_fee, discount, payment_method, payment_status,
          fulfillment_status, shipping_address, customer_name,
          customer_email, customer_phone,
          order_items (
            id, product_name, color, size, unit_price,
            quantity, total_price, image_url, product_id
          )
        `)
        .eq("id", params.id as string)
        .eq("user_id", user.id)
        .single();

      setOrder(data);
      setLoading(false);
    });
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 shadow-sm p-16 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white border border-gray-100 shadow-sm p-12 text-center">
        <Package className="w-10 h-10 text-gray-200 mx-auto mb-4" />
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Order not found</p>
        <Link href="/account/orders" className="mt-4 inline-block text-xs font-bold text-black underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const date = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-100 shadow-sm px-5 md:px-7 py-5 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-black transition-colors p-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs text-gray-400 font-medium">Order</p>
          <h1 className="text-base font-bold text-black tracking-wide">{order.order_number}</h1>
        </div>
        <div className="ml-auto">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 border ${
            order.fulfillment_status === "delivered" ? "bg-green-50 text-green-700 border-green-200" :
            order.fulfillment_status === "shipped"   ? "bg-purple-50 text-purple-700 border-purple-200" :
            order.fulfillment_status === "cancelled" ? "bg-red-50 text-red-600 border-red-200" :
            order.fulfillment_status === "processing"? "bg-blue-50 text-blue-700 border-blue-200" :
                                                       "bg-yellow-50 text-yellow-700 border-yellow-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              order.fulfillment_status === "delivered" ? "bg-green-500" :
              order.fulfillment_status === "shipped"   ? "bg-purple-500" :
              order.fulfillment_status === "cancelled" ? "bg-red-500" :
              order.fulfillment_status === "processing"? "bg-blue-500" : "bg-yellow-400"
            }`} />
            {order.fulfillment_status}
          </span>
        </div>
      </div>

      {/* Status tracker */}
      <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <OrderTracker status={order.fulfillment_status} />
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          Placed on {date}
        </div>
      </div>

      {/* Order items */}
      <div className="bg-white border border-gray-100 shadow-sm">
        <div className="px-5 md:px-7 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package className="w-4 h-4 text-black" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-black">
            Items ({order.order_items?.length || 0})
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="px-5 md:px-7 py-4 flex items-center gap-4">
              <Link href={`/product/${item.product_id}`} className="flex-shrink-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-16 h-20 object-cover border border-gray-100 hover:border-gray-300 transition-colors"
                  />
                ) : (
                  <div className="w-16 h-20 bg-gray-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${item.product_id}`}>
                  <h3 className="text-sm font-semibold text-black hover:text-red-600 transition-colors line-clamp-2">
                    {item.product_name}
                  </h3>
                </Link>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {item.color && (
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 border border-gray-100">
                      Color: {item.color}
                    </span>
                  )}
                  {item.size && (
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 border border-gray-100">
                      Size: {item.size}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Rs.{item.unit_price} each</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-black">Rs.{item.total_price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: Delivery + Payment */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Delivery address */}
        <div className="bg-white border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-black" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-black">Delivery Address</h2>
          </div>
          {order.shipping_address ? (
            <div className="text-sm text-gray-700 leading-relaxed space-y-0.5">
              <p className="font-bold text-black">{order.customer_name || order.shipping_address.name}</p>
              <p>{order.shipping_address.address}</p>
              {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</p>
              {order.customer_phone && (
                <p className="text-gray-500 mt-1.5">📞 {order.customer_phone}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No address on file</p>
          )}
        </div>

        {/* Payment summary */}
        <div className="bg-white border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-black" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-black">Payment</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>Rs.{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className={order.shipping_fee === 0 ? "text-green-600 font-semibold" : ""}>
                {order.shipping_fee === 0 ? "FREE" : `Rs.${order.shipping_fee}`}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-Rs.{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-black border-t border-gray-100 pt-2 mt-1 text-base">
              <span>Total</span>
              <span>Rs.{order.total_amount}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <span>Method</span>
              <span className="capitalize font-medium text-gray-600">{order.payment_method}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Payment Status</span>
              <span className={`font-semibold capitalize ${
                order.payment_status === "paid" ? "text-green-600" :
                order.payment_status === "pending" ? "text-yellow-600" : "text-gray-600"
              }`}>
                {order.payment_status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
