import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Determine if this route needs protection
  const isManagerRoute = pathname.startsWith("/manager-gora");
  const isProtectedCustomerRoute =
    pathname.startsWith("/account") ||
    pathname.startsWith("/checkout");

  // For non-protected routes, return immediately — zero Supabase overhead
  if (!isManagerRoute && !isProtectedCustomerRoute) {
    return NextResponse.next({ request });
  }

  // 2. Build Supabase SSR client (official cookie pattern)
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Secure Server-Side JWT Verification
  // We use getUser() here for production-grade security on admin routes
  // to ensure the token is authentic and valid with the Supabase Auth server.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = isManagerRoute ? "/admin-login" : "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 4. Secure Single-Admin Authorization
  // The system relies on a hardcoded ADMIN_EMAIL environment variable.
  // This guarantees NO customer can ever register as an admin, 
  // and eliminates the need for expensive DB role lookups or custom caching cookies.
  if (isManagerRoute) {
    const adminEmail = process.env.ADMIN_EMAIL;
    
    // Check if the authenticated user's email matches the configured admin email
    const isAdmin = adminEmail && user.email === adminEmail;

    if (!isAdmin) {
      // Authenticated but unauthorized (customer) — redirect away
      const url = request.nextUrl.clone();
      url.pathname = "/admin-login";
      return NextResponse.redirect(url);
    }
    
    // If admin, we allow the request to proceed.
    // Notice we DO NOT need the gora_admin_verified cookie anymore.
  }

  return supabaseResponse;
}



