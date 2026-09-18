"use client";

import { useState, useEffect, useTransition } from "react";
import { Loader2, CheckCircle, AlertCircle, User } from "lucide-react";
import { getUserProfile, updateProfile } from "@/lib/actions/address-actions";

const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    phone: "",
    gender: "",
    dob: "",
  });

  useEffect(() => {
    getUserProfile().then((res) => {
      if (res.success && res.profile) {
        setProfile(res.profile);
        setForm({
          full_name: res.profile.full_name || "",
          username: res.profile.username || "",
          phone: res.profile.phone || "",
          gender: res.profile.gender || "",
          dob: res.profile.dob || "",
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    startTransition(async () => {
      const res = await updateProfile(form);
      if (res.success) {
        setStatus({ type: "success", message: "Profile updated successfully!" });
      } else {
        setStatus({ type: "error", message: res.error || "Something went wrong." });
      }
    });
  };

  const displayName = profile?.full_name || profile?.username || "User";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0]?.toUpperCase() || "")
    .join("");

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 shadow-sm p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 shadow-sm">
      <div className="px-6 md:px-8 py-6 border-b border-gray-100 flex items-center gap-3">
        <User className="w-5 h-5 text-black" />
        <h1 className="text-base font-bold uppercase tracking-widest text-black">Profile Information</h1>
      </div>

      <div className="px-6 md:px-8 py-8">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
            {initials || "U"}
          </div>
          <div>
            <p className="font-bold text-black text-base">{displayName}</p>
            <p className="text-sm text-gray-400">{profile?.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : ""}
            </p>
          </div>
        </div>

        {status && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 mb-6 ${
            status.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-600"
          }`}>
            {status.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Your full name"
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                className="w-full border border-gray-200 pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          {/* Email — read-only */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={profile?.email || ""}
              disabled
              className="w-full border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact support if needed.</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Mobile Number
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* Gender + DOB row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white"
              >
                <option value="">Select</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="bg-black text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
