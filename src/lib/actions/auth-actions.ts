"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

// ─── Helpers ────────────────────────────────────────────────

/** Server-side Supabase client (uses user's session cookie) */
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

/** Admin Supabase client — NEVER used on browser, only in Server Actions */
function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Generate a cryptographically random 6-digit OTP */
function generateOtp(): string {
  return String(Math.floor(100000 + crypto.randomInt(900000)));
}

/** SHA-256 hash the OTP before storing — never store plaintext */
function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// ─── Send OTP via Fast2SMS (Free tier, Indian numbers) ──────────
// Sign up free at https://www.fast2sms.com → API section → get your API key
// Add FAST2SMS_API_KEY to .env.local
export async function sendWhatsAppOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const admin = getSupabaseAdmin();

  // Delete any existing OTPs for this phone to prevent multiple active OTPs
  await admin.from("pending_phone_otps").delete().eq("phone", phone);

  // Store hashed OTP in DB
  const { error: insertError } = await admin.from("pending_phone_otps").insert({
    phone,
    otp_hash: otpHash,
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) {
    console.error("OTP DB insert error:", insertError);
    return { success: false, error: "Failed to create OTP session." };
  }

  // ── Send SMS via Fast2SMS ──────────────────────────────────────
  // Strips country code — Fast2SMS needs 10-digit Indian number only
  const tenDigitPhone = phone.replace(/\D/g, "").slice(-10);
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    // Dev fallback: log OTP to server console so you can test without API key
    console.log(`\n📱 [DEV MODE] OTP for ${phone}: ${otp}\n`);
    return { success: true };
  }

  try {
    const resp = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",          // Fast2SMS OTP route — no template approval needed
        variables_values: otp,
        numbers: tenDigitPhone,
      }),
    });

    const data = await resp.json();

    if (!resp.ok || data.return === false) {
      console.error("Fast2SMS error:", data);
      return { success: false, error: "Failed to send OTP. Please try again." };
    }

    return { success: true };
  } catch (err) {
    console.error("SMS fetch error:", err);
    return { success: false, error: "Network error sending OTP." };
  }
}

// ─── Verify Phone OTP ─────────────────────────────────────────
export async function verifyPhoneOtp(
  phone: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("pending_phone_otps")
    .select("*")
    .eq("phone", phone)
    .single();

  if (error || !data) return { success: false, error: "OTP not found or expired." };

  if (new Date(data.expires_at) < new Date()) {
    await admin.from("pending_phone_otps").delete().eq("phone", phone);
    return { success: false, error: "OTP has expired. Please request a new one." };
  }

  if (data.attempts >= 5) {
    return { success: false, error: "Too many failed attempts. Please request a new OTP." };
  }

  const inputHash = hashOtp(otp.trim());
  if (inputHash !== data.otp_hash) {
    // Increment attempt count
    await admin.from("pending_phone_otps").update({ attempts: data.attempts + 1 }).eq("phone", phone);
    return { success: false, error: `Invalid OTP. ${4 - data.attempts} attempts remaining.` };
  }

  // OTP is valid — delete it
  await admin.from("pending_phone_otps").delete().eq("phone", phone);
  return { success: true };
}

// ─── Register (full multi-step) ──────────────────────────────
export async function registerUser(formData: {
  email: string;
  password: string;
  username: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}): Promise<{ success: boolean; error?: string; needsEmailVerification?: boolean }> {
  const supabase = getSupabaseServer();
  const admin = getSupabaseAdmin();

  // 1. Check uniqueness before signing up
  const { data: existingUsername } = await admin
    .from("profiles")
    .select("id")
    .eq("username", formData.username)
    .single();

  if (existingUsername) return { success: false, error: "Username is already taken." };

  const { data: existingEmail } = await admin
    .from("profiles")
    .select("id")
    .eq("email", formData.email)
    .single();

  if (existingEmail) return { success: false, error: "An account already exists with this email address." };

  const { data: existingPhone } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", formData.phone)
    .single();

  if (existingPhone) return { success: false, error: "An account already exists with this phone number." };

  // 2. Supabase signUp — this triggers email OTP/confirmation automatically
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) return { success: false, error: error.message };
  if (!data.user) return { success: false, error: "Registration failed." };

  // 3. Update the profile row (auto-created by trigger) with extra details
  const { error: profileError } = await admin.from("profiles").update({
    username: formData.username,
    phone: formData.phone,
    address: formData.address,
    city: formData.city,
    pincode: formData.pincode,
    phone_verified: true, // Phone was verified before calling registerUser
  }).eq("id", data.user.id);

  if (profileError) console.error("Profile update error:", profileError.message);

  return { success: true, needsEmailVerification: !data.session };
}

// ─── Login ───────────────────────────────────────────────────
export async function loginUser(
  identifier: string, // email OR username
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServer();
  const admin = getSupabaseAdmin();

  let email = identifier;

  // If identifier doesn't look like email, look up by username
  if (!identifier.includes("@")) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("username", identifier)
      .single();

    if (!profile) return { success: false, error: "No account found with that username." };
    email = profile.email;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { success: false, error: "Incorrect email/username or password." };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Forgot Password ─────────────────────────────────────────
export async function forgotPassword(
  identifier: string // email OR username
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServer();
  const admin = getSupabaseAdmin();

  let email = identifier;

  if (!identifier.includes("@")) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("username", identifier)
      .single();

    if (!profile) return { success: false, error: "No account found with that username." };
    email = profile.email;
  } else {
    // Verify email actually exists
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (!profile) return { success: false, error: "No account found with that email address." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password`,
  });

  if (error) return { success: false, error: error.message };

  return { success: true };
}

// ─── Logout ──────────────────────────────────────────────────
export async function logoutUser() {
  const supabase = getSupabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}


export async function updateUserProfile(formData: {
  username: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServer();
  const admin = getSupabaseAdmin();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Check if username is taken by someone else
  const { data: existingUsername } = await admin
    .from("profiles")
    .select("id")
    .eq("username", formData.username)
    .neq("id", user.id)
    .single();

  if (existingUsername) return { success: false, error: "Username is already taken." };

  // Check if phone is taken by someone else
  const { data: existingPhone } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", formData.phone)
    .neq("id", user.id)
    .single();

  if (existingPhone) return { success: false, error: "Phone number is already associated with another account." };

  const { error } = await admin
    .from("profiles")
    .update({
      username: formData.username,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      pincode: formData.pincode,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  return { success: true };
}
