"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Search, Bell, Layers, MonitorPlay } from "lucide-react";
import { adminLogout } from "@/lib/actions/admin-auth";
import NotificationBell from "@/components/admin/NotificationBell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Dashboard", href: "/manager-gora", icon: LayoutDashboard },
    { name: "Products", href: "/manager-gora/products", icon: Package },
    { name: "Categories", href: "/manager-gora/categories", icon: Layers },
    { name: "Storefront", href: "/manager-gora/storefront", icon: MonitorPlay },
    { name: "Orders", href: "/manager-gora/orders", icon: ShoppingCart },
    { name: "Customers", href: "/manager-gora/customers", icon: Users },
    { name: "Settings", href: "/manager-gora/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await adminLogout();
    router.push("/admin-login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - z-20 ensures it stays above the main content area */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col relative z-20 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-2xl font-black tracking-widest text-black uppercase" style={{ fontFamily: "Georgia, serif" }}>
            GORA
          </span>
          <span className="ml-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Admin</span>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/manager-gora" 
              ? pathname === "/manager-gora"
              : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                prefetch={false}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all duration-150 active:scale-95 relative z-50 ${
                  isActive 
                    ? "bg-black text-white shadow-sm" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
              >
                <Icon className="w-5 h-5 pointer-events-none" />
                <span className="pointer-events-none">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-md transition-all duration-150 active:scale-95">
            <LogOut className="w-5 h-5" />
            Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Content - z-10 keeps it strictly below the sidebar stacking context */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8">
          <div className="flex-1 flex items-center gap-4">
            <div className="relative w-64 hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 focus:outline-none rounded-md text-sm transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="h-8 w-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
              AD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
