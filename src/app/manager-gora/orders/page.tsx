"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Search, Eye, Filter, CheckCircle2, Truck, Clock, AlertCircle, X, Loader2 } from "lucide-react";
import { getAdminOrders, updateOrderStatus } from "@/lib/actions/admin-orders";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    const data = await getAdminOrders();
    setOrders(data);
    setIsLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setUpdating(true);
    const res = await updateOrderStatus(orderId, status);
    if (res.success) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, fulfillment_status: status } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, fulfillment_status: status });
      }
    } else {
      alert(res.error || "Failed to update status");
    }
    setUpdating(false);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.fulfillment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Track and manage customer orders and fulfillment.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by order #, customer name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:border-black outline-none transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-md text-sm py-2 pl-3 pr-8 focus:border-black outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Fulfillment</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p>No orders found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{order.order_number}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-gray-500 text-xs">{order.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.fulfillment_status)}`}>
                        {order.fulfillment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      Rs.{order.total_amount}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 text-gray-500 hover:text-black font-semibold transition-colors border border-gray-200 px-3 py-1.5 rounded-md text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Order Details - {selectedOrder.order_number}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 text-sm">
                  <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Customer Details</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p><span className="text-gray-500">Name:</span> <span className="font-medium text-black">{selectedOrder.customer_name}</span></p>
                    <p><span className="text-gray-500">Email:</span> <span className="font-medium text-black">{selectedOrder.customer_email}</span></p>
                    <p><span className="text-gray-500">Phone:</span> <span className="font-medium text-black">{selectedOrder.customer_phone}</span></p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Shipping Address</h3>
                  <div className="bg-gray-50 p-4 rounded-md h-full">
                    <p className="font-medium text-black">{selectedOrder.shipping_address?.address}</p>
                    <p className="font-medium text-black">{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state}</p>
                    <p className="font-medium text-black">{selectedOrder.shipping_address?.pincode}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  <p><span className="text-gray-500">Date:</span> <span className="font-medium text-black">{new Date(selectedOrder.created_at).toLocaleString()}</span></p>
                  <p><span className="text-gray-500">Subtotal:</span> <span className="font-medium text-black">Rs.{selectedOrder.subtotal}</span></p>
                  <p><span className="text-gray-500">Shipping:</span> <span className="font-medium text-black">Rs.{selectedOrder.shipping_fee}</span></p>
                  <p><span className="text-gray-500">Total:</span> <span className="font-bold text-black text-base">Rs.{selectedOrder.total_amount}</span></p>
                  <p><span className="text-gray-500">Payment:</span> <span className="font-medium text-black uppercase">{selectedOrder.payment_method} ({selectedOrder.payment_status})</span></p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs border-b pb-2">Purchased Items ({selectedOrder.order_items?.length || 0})</h3>
                <div className="divide-y divide-gray-100">
                  {(selectedOrder.order_items || []).map((item: any) => (
                    <div key={item.id} className="py-4 flex gap-4">
                      <div className="w-20 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        <img src={item.image_url || '/placeholder.jpg'} alt={item.product_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-gray-900">{item.product_name}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          SKU: <span className="font-mono text-black bg-gray-100 px-1 py-0.5 rounded">{item.product_variants?.sku || item.sku || "N/A"}</span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1 flex gap-3">
                          {item.color && <span>Color: <span className="font-medium text-black">{item.color}</span></span>}
                          {item.size && <span>Size: <span className="font-medium text-black">{item.size}</span></span>}
                        </p>
                      </div>
                      <div className="text-right flex flex-col justify-center">
                        <p className="font-bold text-gray-900">Rs.{item.unit_price}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        <p className="font-bold text-[#e32c2b] mt-1">Rs.{item.total_price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 space-y-3">
                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Update Fulfillment Status</h3>
                <div className="flex gap-2">
                  <button 
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder.id, "processing")}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${selectedOrder.fulfillment_status === "processing" ? "bg-yellow-400 text-yellow-900 cursor-default" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    Processing
                  </button>
                  <button 
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder.id, "shipped")}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${selectedOrder.fulfillment_status === "shipped" ? "bg-blue-500 text-white cursor-default" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    Shipped
                  </button>
                  <button 
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder.id, "delivered")}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${selectedOrder.fulfillment_status === "delivered" ? "bg-green-500 text-white cursor-default" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    Delivered
                  </button>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-lg">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-black text-white font-bold uppercase tracking-widest text-sm py-3 rounded-md hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
