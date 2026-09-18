"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getPendingOrdersCount } from "@/lib/actions/admin-orders";

export default function NotificationBell() {
  const [hasNew, setHasNew] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/manager-gora/orders") {
      setHasNew(false);
    }
  }, [pathname]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkOrders = async () => {
      // Don't show notification if already on the orders page
      if (pathname === "/manager-gora/orders") return;

      const count = await getPendingOrdersCount();
      if (count > 0) {
        setHasNew(true);
      }
    };

    // Initial check
    checkOrders();

    // Poll every 15 seconds for production-like real-time updates
    intervalId = setInterval(checkOrders, 15000);

    return () => clearInterval(intervalId);
  }, [pathname]);

  return (
    <Link href="/manager-gora/orders" className="p-2 text-gray-400 hover:text-black transition-colors relative block">
      <Bell className="w-5 h-5" />
      {hasNew && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
      )}
    </Link>
  );
}
