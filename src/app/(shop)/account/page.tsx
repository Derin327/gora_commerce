"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, MapPin, Loader2, Save, LogOut, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { updateUserProfile, logoutUser } from "@/lib/actions/auth-actions";

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profile, setProfile] = useState({
    email: "",
    username: "",
    phone: "",
    address: "",
    city: "",
    pincode: ""
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      
      if (data) {
        setProfile({
          email: data.email || user.email || "",
          username: data.username || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          pincode: data.pincode || ""
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    const res = await updateUserProfile(profile);
    if (res.success) {
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } else {
      setMessage({ type: "error", text: res.error || "Failed to update profile." });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight">My Account</h1>
          <p className="text-gray-500 mt-2">Manage your personal information and shipping details.</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 md:p-8">
        {message.text && (
          <div className={`p-4 rounded-md mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : null}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                value={profile.email} 
                disabled 
                className="w-full border border-gray-200 bg-gray-50 text-gray-500 p-3 rounded-md text-sm outline-none cursor-not-allowed" 
              />
              <p className="text-[11px] text-gray-400">Email cannot be changed.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  name="username"
                  value={profile.username} 
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-black rounded-md text-sm outline-none transition-colors" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  name="phone"
                  value={profile.phone} 
                  onChange={handleChange}
                  required
                  placeholder="e.g. 919876543210"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-black rounded-md text-sm outline-none transition-colors" 
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4" /> Default Shipping Address
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Full Address</label>
                <input 
                  type="text" 
                  name="address"
                  value={profile.address} 
                  onChange={handleChange}
                  required
                  placeholder="Street address, Apartment, Suite, etc."
                  className="w-full border border-gray-200 focus:border-black p-3 rounded-md text-sm outline-none transition-colors" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">City</label>
                <input 
                  type="text" 
                  name="city"
                  value={profile.city} 
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 focus:border-black p-3 rounded-md text-sm outline-none transition-colors" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">PIN Code</label>
                <input 
                  type="text" 
                  name="pincode"
                  value={profile.pincode} 
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 focus:border-black p-3 rounded-md text-sm outline-none transition-colors" 
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-black text-white font-bold uppercase tracking-wider text-sm py-3 px-8 rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
