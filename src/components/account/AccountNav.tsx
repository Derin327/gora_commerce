"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, MapPin, Package, Shield, LogOut, ChevronRight } from "lucide-react";
import { logoutUser } from "@/lib/actions/auth-actions";

const NAV_ITEMS = [
  { href: "/account",           label: "Profile",   icon: User },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/orders",    label: "Orders",    icon: Package },
  { href: "/account/security",  label: "Security",  icon: Shield },
];

export function AccountSidebarNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  return (
    <nav className="bg-white border border-gray-100 shadow-sm overflow-hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center justify-between px-5 py-3.5 text-sm font-semibold border-b border-gray-50 last:border-0 transition-colors group ${
              active
                ? "bg-black text-white border-b-black"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon className="w-4 h-4" />
              {label}
            </span>
            <ChevronRight className={`w-3.5 h-3.5 transition-colors ${active ? "text-white" : "text-gray-300 group-hover:text-gray-500"}`} />
          </Link>
        );
      })}

      <form action={logoutUser}>
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </form>
    </nav>
  );
}

export function AccountMobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  return (
    <div className="md:hidden bg-white border-b border-gray-100 overflow-x-auto no-scrollbar">
      <div className="flex px-2 gap-0 min-w-max">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                active
                  ? "text-black border-black"
                  : "text-gray-400 border-transparent hover:text-black hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
