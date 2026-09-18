import { LogOut } from "lucide-react";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logoutUser } from "@/lib/actions/auth-actions";
import { AccountSidebarNav, AccountMobileNav } from "@/components/account/AccountNav";

async function getProfileSummary() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data } = await admin
    .from("profiles")
    .select("username, full_name, email, created_at")
    .eq("id", user.id)
    .single();

  return data;
}

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfileSummary();

  if (!profile) redirect("/login?callbackUrl=/account");

  const displayName = profile.full_name || profile.username || "User";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0]?.toUpperCase() || "")
    .join("");

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile: user info bar */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {initials || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-black truncate">{displayName}</p>
          <p className="text-xs text-gray-400 truncate">{profile.email}</p>
        </div>
        <form action={logoutUser}>
          <button
            type="submit"
            className="text-xs font-bold text-red-500 uppercase tracking-wider px-3 py-1.5 border border-red-200 hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>

      {/* Mobile: tab nav with active state */}
      <AccountMobileNav />

      {/* Desktop layout */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex gap-7">
          {/* Sidebar — desktop only */}
          <aside className="hidden md:flex flex-col w-60 flex-shrink-0">
            {/* Avatar card */}
            <div className="bg-white border border-gray-100 px-5 py-6 mb-3 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {initials || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-black text-sm truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{profile.email}</p>
                  {profile.created_at && (
                    <p className="text-[10px] text-gray-300 mt-1">
                      Member since {new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Active-state navigation */}
            <AccountSidebarNav />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
