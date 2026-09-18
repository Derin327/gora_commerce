"use client";

import { useState, useEffect, useTransition } from "react";
import {
  MapPin, Plus, Pencil, Trash2, Star, Loader2,
  CheckCircle, AlertCircle, X, Home, Briefcase, MoreHorizontal
} from "lucide-react";
import {
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setPrimaryAddress,
  type UserAddress,
  type AddressFormData,
} from "@/lib/actions/address-actions";

const LABELS = ["Home", "Work", "Other"];
const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli",
  "Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"
];

const EMPTY_FORM: AddressFormData = {
  label: "Home",
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "Tamil Nadu",
  pincode: "",
  is_primary: false,
};

function LabelIcon({ label }: { label: string }) {
  if (label === "Home") return <Home className="w-4 h-4" />;
  if (label === "Work") return <Briefcase className="w-4 h-4" />;
  return <MoreHorizontal className="w-4 h-4" />;
}

interface AddressFormProps {
  initial?: AddressFormData;
  onSave: (data: AddressFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
  isFirst?: boolean;
}

function AddressForm({ initial = EMPTY_FORM, onSave, onCancel, isSaving, isFirst }: AddressFormProps) {
  const [form, setForm] = useState<AddressFormData>(initial);

  const set = (k: keyof AddressFormData, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      className="space-y-4"
    >
      {/* Label selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          Save As
        </label>
        <div className="flex gap-2">
          {LABELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => set("label", l)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${
                form.label === l
                  ? "bg-black text-white border-black"
                  : "border-gray-200 text-gray-600 hover:border-black"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Full name + Phone row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Full Name *</label>
          <input
            required
            type="text"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Recipient name"
            className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Phone *</label>
          <input
            required
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>

      {/* Address line 1 */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
          Address Line 1 *
        </label>
        <input
          required
          type="text"
          value={form.address_line1}
          onChange={(e) => set("address_line1", e.target.value)}
          placeholder="Flat / House No., Street, Area"
          className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
        />
      </div>

      {/* Address line 2 */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
          Address Line 2 <span className="normal-case font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={form.address_line2 || ""}
          onChange={(e) => set("address_line2", e.target.value)}
          placeholder="Landmark, Colony (optional)"
          className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
        />
      </div>

      {/* City, State, Pincode */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">City *</label>
          <input
            required
            type="text"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="City"
            className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">State *</label>
          <select
            required
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
            className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors bg-white"
          >
            {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Pincode *</label>
          <input
            required
            type="text"
            maxLength={6}
            pattern="\d{6}"
            value={form.pincode}
            onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
            placeholder="600001"
            className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>

      {/* Set as Primary */}
      {!isFirst && (
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => set("is_primary", !form.is_primary)}
            className={`w-5 h-5 border-2 flex items-center justify-center transition-all flex-shrink-0 ${
              form.is_primary ? "bg-black border-black" : "border-gray-300"
            }`}
          >
            {form.is_primary && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span className="text-sm text-gray-600 font-medium">Set as primary delivery address</span>
        </label>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-black text-white px-6 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-sm font-semibold border border-gray-200 hover:border-black transition-colors text-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [primaryingId, setPrimaryingId] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const load = () => {
    setLoading(true);
    getUserAddresses().then((res) => {
      if (res.success) setAddresses(res.addresses || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const showStatus = (type: "success" | "error", message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleAdd = (data: AddressFormData) => {
    startSaving(async () => {
      const res = await addAddress(data);
      if (res.success) {
        showStatus("success", "Address saved!");
        setShowAddForm(false);
        load();
      } else {
        showStatus("error", res.error || "Failed to save");
      }
    });
  };

  const handleUpdate = (id: string, data: AddressFormData) => {
    startSaving(async () => {
      const res = await updateAddress(id, data);
      if (res.success) {
        showStatus("success", "Address updated!");
        setEditingId(null);
        load();
      } else {
        showStatus("error", res.error || "Update failed");
      }
    });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    startSaving(async () => {
      const res = await deleteAddress(id);
      if (res.success) {
        showStatus("success", "Address deleted");
        load();
      } else {
        showStatus("error", res.error || "Delete failed");
      }
      setDeletingId(null);
    });
  };

  const handleSetPrimary = (id: string) => {
    setPrimaryingId(id);
    startSaving(async () => {
      const res = await setPrimaryAddress(id);
      if (res.success) {
        showStatus("success", "Primary address updated!");
        load();
      } else {
        showStatus("error", res.error || "Failed");
      }
      setPrimaryingId(null);
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-100 shadow-sm px-6 md:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-black" />
          <h1 className="text-base font-bold uppercase tracking-widest text-black">Saved Addresses</h1>
        </div>
        {!showAddForm && (
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add New
          </button>
        )}
      </div>

      {/* Status toast */}
      {status && (
        <div className={`flex items-center justify-between gap-2 text-sm px-5 py-3 ${
          status.type === "success"
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-600"
        }`}>
          <span className="flex items-center gap-2">
            {status.type === "success"
              ? <CheckCircle className="w-4 h-4" />
              : <AlertCircle className="w-4 h-4" />}
            {status.message}
          </span>
          <button onClick={() => setStatus(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white border border-black shadow-sm px-6 md:px-8 py-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-black mb-6 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add New Address
          </h2>
          <AddressForm
            isFirst={addresses.length === 0}
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
            isSaving={isSaving}
          />
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="bg-white border border-gray-100 shadow-sm p-12 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : addresses.length === 0 && !showAddForm ? (
        <div className="bg-white border border-gray-100 shadow-sm p-12 text-center">
          <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">No addresses saved</p>
          <p className="text-xs text-gray-400 mb-6">Add your home or office address for faster checkout.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            Add First Address
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white border shadow-sm ${
                addr.is_primary ? "border-black" : "border-gray-100"
              }`}
            >
              {editingId === addr.id ? (
                <div className="px-6 md:px-8 py-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-black mb-6 flex items-center gap-2">
                    <Pencil className="w-4 h-4" /> Edit Address
                  </h2>
                  <AddressForm
                    initial={{
                      label: addr.label,
                      full_name: addr.full_name,
                      phone: addr.phone,
                      address_line1: addr.address_line1,
                      address_line2: addr.address_line2,
                      city: addr.city,
                      state: addr.state,
                      pincode: addr.pincode,
                      is_primary: addr.is_primary,
                    }}
                    onSave={(data) => handleUpdate(addr.id, data)}
                    onCancel={() => setEditingId(null)}
                    isSaving={isSaving}
                  />
                </div>
              ) : (
                <div className="px-6 md:px-8 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Label badge */}
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider flex-shrink-0 ${
                        addr.is_primary ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                      }`}>
                        <LabelIcon label={addr.label} />
                        {addr.label}
                      </div>
                      {addr.is_primary && (
                        <div className="flex items-center gap-1 text-xs font-bold text-black uppercase tracking-wider mt-0.5">
                          <Star className="w-3 h-3 fill-black" /> Primary
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setEditingId(addr.id); setShowAddForm(false); }}
                        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        disabled={deletingId === addr.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        {deletingId === addr.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Address details */}
                  <div className="mt-3 text-sm text-gray-700 leading-relaxed">
                    <p className="font-semibold text-black">{addr.full_name}</p>
                    <p>{addr.address_line1}</p>
                    {addr.address_line2 && <p>{addr.address_line2}</p>}
                    <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-gray-500 mt-0.5">Phone: {addr.phone}</p>
                  </div>

                  {/* Set primary */}
                  {!addr.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(addr.id)}
                      disabled={primaryingId === addr.id}
                      className="mt-4 text-xs font-bold uppercase tracking-wider border border-gray-200 px-4 py-2 hover:border-black hover:text-black text-gray-500 transition-colors flex items-center gap-2"
                    >
                      {primaryingId === addr.id
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Setting...</>
                        : <><Star className="w-3 h-3" /> Set as Primary</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
