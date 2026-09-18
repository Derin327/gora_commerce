"use client";

import { useCartStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Truck, ShieldCheck, Loader2, MapPin, Plus, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { createOrder } from "@/lib/actions/checkout";
import { getUserAddresses, type UserAddress } from "@/lib/actions/address-actions";

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [addressesLoading, setAddressesLoading] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    setMounted(true);
    
    const fetchUserAndAddresses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?callbackUrl=/checkout");
        return;
      }
      
      // Pre-fill email
      setFormData(prev => ({ ...prev, email: user.email || "" }));

      // Fetch saved addresses
      const { success, addresses } = await getUserAddresses();
      if (success && addresses && addresses.length > 0) {
        setSavedAddresses(addresses);
        
        // Auto-select primary address, or the first one
        const primary = addresses.find(a => a.is_primary) || addresses[0];
        setSelectedAddressId(primary.id);
        
        // Populate form with this address data
        setFormData(prev => ({
          ...prev,
          fullName: primary.full_name,
          phone: primary.phone,
          address: primary.address_line1 + (primary.address_line2 ? `, ${primary.address_line2}` : ""),
          city: primary.city,
          state: primary.state,
          pincode: primary.pincode,
        }));
      } else {
        // No addresses, fetch basic profile data to prefill Name/Phone
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profile) {
          setFormData(prev => ({
            ...prev,
            fullName: profile.full_name || prev.fullName,
            phone: profile.phone || prev.phone,
          }));
        }
      }
      setAddressesLoading(false);
    };

    fetchUserAndAddresses();
  }, [supabase, router]);

  const handleAddressSelect = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setFormData(prev => ({
      ...prev,
      fullName: addr.full_name,
      phone: addr.phone,
      address: addr.address_line1 + (addr.address_line2 ? `, ${addr.address_line2}` : ""),
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    }));
  };

  const handleSelectNew = () => {
    setSelectedAddressId("new");
    // Clear out address fields, keep email/name/phone if possible
    setFormData(prev => ({
      ...prev,
      address: "",
      city: "",
      state: "",
      pincode: "",
    }));
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = total > 2000 ? 0 : 100;
  const finalTotal = total + shipping;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await createOrder({
        items,
        shippingInfo: formData,
      });

      if (res.error) throw new Error(res.error);

      clearCart();
      router.push(`/checkout/success?order=${res.orderNumber}`);
    } catch (err: any) {
      setError(err.message || "Failed to place order.");
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (!mounted) return <div className="min-h-screen bg-white" />;

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Truck className="w-8 h-8 text-gray-300" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-black mb-2">Checkout</h1>
        <p className="text-gray-500 mb-6 font-medium">Your cart is empty.</p>
        <button onClick={() => router.push("/shop/hoodies")} className="bg-black text-white px-8 py-3 rounded-md font-bold uppercase tracking-widest text-sm hover:bg-[#e32c2b] transition-colors">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        <h1 className="text-2xl font-black uppercase tracking-widest text-black mb-8">Secure Checkout</h1>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Column - Form */}
          <div className="flex-1">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              
              {/* Shipping Address Selection */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs">1</span>
                  Delivery Address
                </h2>
                
                {addressesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                  </div>
                ) : (
                  <>
                    {/* Horizontal scroll for mobile addresses */}
                    {savedAddresses.length > 0 && (
                      <div className="flex overflow-x-auto gap-4 pb-4 mb-2 no-scrollbar snap-x">
                        {savedAddresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <div 
                              key={addr.id}
                              onClick={() => handleAddressSelect(addr)}
                              className={`relative snap-start flex-shrink-0 w-[260px] p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                isSelected ? "border-black bg-gray-50" : "border-gray-100 hover:border-gray-300"
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-black" />}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-200 px-2 py-0.5 rounded-sm">
                                  {addr.label}
                                </span>
                                {addr.is_primary && (
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#e32c2b]">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-bold text-black mb-1 truncate">{addr.full_name}</p>
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                {addr.address_line1}, {addr.address_line2 && `${addr.address_line2}, `}{addr.city}, {addr.state} - {addr.pincode}
                              </p>
                            </div>
                          );
                        })}
                        
                        {/* New Address Card */}
                        <div 
                          onClick={handleSelectNew}
                          className={`snap-start flex-shrink-0 w-[180px] p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                            selectedAddressId === "new" ? "border-black bg-gray-50 text-black" : "border-gray-200 text-gray-400 hover:border-gray-400"
                          }`}
                        >
                          <Plus className="w-6 h-6 mb-2" />
                          <span className="text-xs font-bold uppercase tracking-wider text-center">Add New<br/>Address</span>
                        </div>
                      </div>
                    )}

                    {/* Manual entry form (shown if no addresses, or if "new" is selected) */}
                    {selectedAddressId === "new" && (
                      <div className="space-y-4 mt-2 p-5 border border-gray-100 bg-gray-50 rounded-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Full Name</label>
                            <input required name="fullName" value={formData.fullName} onChange={handleInputChange} type="text" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-all text-sm" placeholder="John Doe" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Phone Number</label>
                            <input required name="phone" value={formData.phone} onChange={handleInputChange} type="tel" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-all text-sm" placeholder="9876543210" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Street Address</label>
                          <input required name="address" value={formData.address} onChange={handleInputChange} type="text" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-all text-sm" placeholder="123 Main St, Apt 4B" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">City</label>
                            <input required name="city" value={formData.city} onChange={handleInputChange} type="text" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-all text-sm" placeholder="Mumbai" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">State</label>
                            <input required name="state" value={formData.state} onChange={handleInputChange} type="text" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-all text-sm" placeholder="Maharashtra" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Pincode / ZIP</label>
                          <input required name="pincode" value={formData.pincode} onChange={handleInputChange} type="text" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-all text-sm" placeholder="400001" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Payment Info */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs">2</span>
                  Payment Method
                </h2>
                <div className="p-4 border-2 border-black rounded-xl bg-gray-50 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-4 border-black flex items-center justify-center bg-white" />
                  <span className="font-bold text-sm">Cash on Delivery (COD)</span>
                </div>
              </div>

            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:w-[400px]">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{item.color} | {item.size}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-gray-500">Qty: {item.quantity}</span>
                        <span className="text-sm font-bold text-gray-900">Rs.{item.price * item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm font-semibold text-gray-600">
                  <span>Subtotal</span>
                  <span>Rs.{total}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-600 uppercase tracking-wider text-xs">Free</span> : `Rs.${shipping}`}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-black text-black">Rs.{finalTotal}</span>
                </div>
              </div>

              <button 
                form="checkout-form"
                type="submit" 
                disabled={loading || addressesLoading}
                className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Place Order (COD)"}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" /> Secure Checkout
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
