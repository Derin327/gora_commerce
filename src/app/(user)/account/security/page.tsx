"use client";

import { useState, useTransition } from "react";
import { Shield, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { changePassword } from "@/lib/actions/address-actions";

function StrengthMeter({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score] : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p className={`text-xs font-semibold ${
        score <= 1 ? "text-red-500" :
        score === 2 ? "text-yellow-600" :
        score === 3 ? "text-blue-500" : "text-green-600"
      }`}>
        {labels[score]} password
      </p>
    </div>
  );
}

export default function SecurityPage() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (form.newPassword.length < 8) {
      setStatus({ type: "error", message: "Password must be at least 8 characters." });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    startTransition(async () => {
      const res = await changePassword(form.newPassword);
      if (res.success) {
        setStatus({ type: "success", message: "Password changed successfully!" });
        setForm({ newPassword: "", confirmPassword: "" });
      } else {
        setStatus({ type: "error", message: res.error || "Failed to change password." });
      }
    });
  };

  return (
    <div className="bg-white border border-gray-100 shadow-sm">
      <div className="px-6 md:px-8 py-6 border-b border-gray-100 flex items-center gap-3">
        <Shield className="w-5 h-5 text-black" />
        <h1 className="text-base font-bold uppercase tracking-widest text-black">Security</h1>
      </div>

      <div className="px-6 md:px-8 py-8 max-w-lg">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-1">Change Password</h2>
        <p className="text-xs text-gray-400 mb-6">
          Use a strong password you haven&apos;t used before. Minimum 8 characters.
        </p>

        {status && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 mb-6 ${
            status.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-600"
          }`}>
            {status.type === "success"
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Minimum 8 characters"
                className="w-full border border-gray-200 px-4 py-3 pr-12 text-sm focus:outline-none focus:border-black transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <StrengthMeter password={form.newPassword} />
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
                className={`w-full border px-4 py-3 pr-12 text-sm focus:outline-none transition-colors ${
                  form.confirmPassword && form.confirmPassword !== form.newPassword
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-black"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.confirmPassword && form.confirmPassword !== form.newPassword && (
              <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="bg-black text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : "Update Password"}
          </button>
        </form>

        {/* Security tips */}
        <div className="mt-8 border-t border-gray-100 pt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Tips for a strong password</p>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${form.newPassword.length >= 8 ? "bg-green-500" : "bg-gray-300"}`} />
              At least 8 characters
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${/[A-Z]/.test(form.newPassword) ? "bg-green-500" : "bg-gray-300"}`} />
              At least one uppercase letter (A-Z)
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${/[0-9]/.test(form.newPassword) ? "bg-green-500" : "bg-gray-300"}`} />
              At least one number (0-9)
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${/[^A-Za-z0-9]/.test(form.newPassword) ? "bg-green-500" : "bg-gray-300"}`} />
              At least one special character (!@#\$...)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
