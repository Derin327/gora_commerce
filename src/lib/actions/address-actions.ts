"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────
export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressFormData {
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_primary?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────
function getSupabaseServer() {
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

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getAuthUser() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─── Get all addresses for current user ──────────────────────
export async function getUserAddresses(): Promise<{
  success: boolean;
  addresses?: UserAddress[];
  error?: string;
}> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("user_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, addresses: data as UserAddress[] };
}

// ─── Add new address ─────────────────────────────────────────
export async function addAddress(formData: AddressFormData): Promise<{
  success: boolean;
  address?: UserAddress;
  error?: string;
}> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const admin = getSupabaseAdmin();

  // If this is the first address, make it primary automatically
  const { count } = await admin
    .from("user_addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const isPrimary = formData.is_primary || count === 0;

  // Unset other primaries if this one is being set as primary
  if (isPrimary) {
    await admin
      .from("user_addresses")
      .update({ is_primary: false })
      .eq("user_id", user.id);
  }

  const { data, error } = await admin
    .from("user_addresses")
    .insert({
      user_id: user.id,
      label: formData.label,
      full_name: formData.full_name,
      phone: formData.phone,
      address_line1: formData.address_line1,
      address_line2: formData.address_line2 || null,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      is_primary: isPrimary,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/addresses");
  return { success: true, address: data as UserAddress };
}

// ─── Update an address ───────────────────────────────────────
export async function updateAddress(
  addressId: string,
  formData: AddressFormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const admin = getSupabaseAdmin();

  // Verify ownership
  const { data: existing } = await admin
    .from("user_addresses")
    .select("id, user_id")
    .eq("id", addressId)
    .single();

  if (!existing || existing.user_id !== user.id)
    return { success: false, error: "Address not found" };

  // If setting as primary, unset others
  if (formData.is_primary) {
    await admin
      .from("user_addresses")
      .update({ is_primary: false })
      .eq("user_id", user.id);
  }

  const { error } = await admin
    .from("user_addresses")
    .update({
      label: formData.label,
      full_name: formData.full_name,
      phone: formData.phone,
      address_line1: formData.address_line1,
      address_line2: formData.address_line2 || null,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      is_primary: formData.is_primary || false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", addressId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/addresses");
  return { success: true };
}

// ─── Delete an address ───────────────────────────────────────
export async function deleteAddress(addressId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const admin = getSupabaseAdmin();

  const { data: existing } = await admin
    .from("user_addresses")
    .select("id, user_id, is_primary")
    .eq("id", addressId)
    .single();

  if (!existing || existing.user_id !== user.id)
    return { success: false, error: "Address not found" };

  const { error } = await admin
    .from("user_addresses")
    .delete()
    .eq("id", addressId);

  if (error) return { success: false, error: error.message };

  // If deleted primary, auto-promote the next one
  if (existing.is_primary) {
    const { data: next } = await admin
      .from("user_addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (next) {
      await admin
        .from("user_addresses")
        .update({ is_primary: true })
        .eq("id", next.id);
    }
  }

  revalidatePath("/account/addresses");
  return { success: true };
}

// ─── Set primary address ─────────────────────────────────────
export async function setPrimaryAddress(addressId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const admin = getSupabaseAdmin();

  // Verify ownership
  const { data: existing } = await admin
    .from("user_addresses")
    .select("id, user_id")
    .eq("id", addressId)
    .single();

  if (!existing || existing.user_id !== user.id)
    return { success: false, error: "Address not found" };

  // Unset all primaries for this user
  await admin
    .from("user_addresses")
    .update({ is_primary: false })
    .eq("user_id", user.id);

  // Set the target as primary
  const { error } = await admin
    .from("user_addresses")
    .update({ is_primary: true, updated_at: new Date().toISOString() })
    .eq("id", addressId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/addresses");
  return { success: true };
}

// ─── Get user profile ────────────────────────────────────────
export async function getUserProfile(): Promise<{
  success: boolean;
  profile?: {
    id: string;
    email: string;
    username: string;
    phone: string;
    full_name?: string;
    gender?: string;
    dob?: string;
    address: string;
    city: string;
    pincode: string;
    created_at: string;
  };
  error?: string;
}> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return { success: false, error: error?.message || "Profile not found" };

  return {
    success: true,
    profile: {
      id: data.id,
      email: data.email,
      username: data.username || "",
      phone: data.phone || "",
      full_name: data.full_name || "",
      gender: data.gender || "",
      dob: data.dob || "",
      address: data.address || "",
      city: data.city || "",
      pincode: data.pincode || "",
      created_at: data.created_at || "",
    },
  };
}

// ─── Update profile ──────────────────────────────────────────
export async function updateProfile(formData: {
  username: string;
  phone: string;
  full_name?: string;
  gender?: string;
  dob?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServer();
  const admin = getSupabaseAdmin();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Check username uniqueness
  const { data: takenByOther } = await admin
    .from("profiles")
    .select("id")
    .eq("username", formData.username)
    .neq("id", user.id)
    .single();

  if (takenByOther) return { success: false, error: "Username is already taken." };

  // Check phone uniqueness
  const { data: phoneTaken } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", formData.phone)
    .neq("id", user.id)
    .single();

  if (phoneTaken) return { success: false, error: "Phone number is already associated with another account." };

  const { error } = await admin
    .from("profiles")
    .update({
      username: formData.username,
      phone: formData.phone,
      full_name: formData.full_name || null,
      gender: formData.gender || null,
      dob: formData.dob || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/account");
  return { success: true };
}

// ─── Change password ─────────────────────────────────────────
export async function changePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
