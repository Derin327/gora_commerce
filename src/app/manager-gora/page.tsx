import { createClient } from "@supabase/supabase-js";
import {
  IndianRupee, ShoppingBag, Users, Package,
  TrendingUp, TrendingDown, Clock, ArrowRight,
  AlertTriangle, CheckCircle2, Truck, XCircle
} from "lucide-react";
import Link from "next/link";

// Admin client — server-side only, bypasses RLS
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ─── Data fetchers ────────────────────────────────────────────

async function getDashboardStats() {
  const admin = getAdmin();
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  // Parallel fetches
  const [
    { data: allOrders },
    { data: thisMonthOrders },
    { data: lastMonthOrders },
    { count: totalCustomers },
    { count: thisMonthCustomers },
    { count: lastMonthCustomers },
    { count: totalProducts },
    { count: lowStockCount },
    { data: pendingOrders },
  ] = await Promise.all([
    admin.from("orders").select("total_amount, fulfillment_status, payment_status"),
    admin.from("orders").select("total_amount").gte("created_at", startOfThisMonth),
    admin.from("orders").select("total_amount").gte("created_at", startOfLastMonth).lte("created_at", endOfLastMonth),
    admin.from("profiles").select("*", { count: "exact", head: true }).neq("role", "admin"),
    admin.from("profiles").select("*", { count: "exact", head: true }).neq("role", "admin").gte("created_at", startOfThisMonth),
    admin.from("profiles").select("*", { count: "exact", head: true }).neq("role", "admin").gte("created_at", startOfLastMonth).lte("created_at", endOfLastMonth),
    admin.from("products").select("*", { count: "exact", head: true }),
    admin.from("product_variants").select("*", { count: "exact", head: true }).lte("stock_quantity", 5),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("fulfillment_status", "pending"),
  ]);

  const totalRevenue      = (allOrders || []).reduce((s, o) => s + (o.total_amount || 0), 0);
  const thisMonthRevenue  = (thisMonthOrders || []).reduce((s, o) => s + (o.total_amount || 0), 0);
  const lastMonthRevenue  = (lastMonthOrders || []).reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalOrders       = allOrders?.length || 0;
  const thisMonthOrderCount = thisMonthOrders?.length || 0;
  const lastMonthOrderCount = lastMonthOrders?.length || 0;

  const revenueTrend = lastMonthRevenue > 0
    ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : null;
  const ordersTrend = lastMonthOrderCount > 0
    ? (((thisMonthOrderCount - lastMonthOrderCount) / lastMonthOrderCount) * 100).toFixed(1)
    : null;
  const customersTrend = (lastMonthCustomers || 0) > 0
    ? ((((thisMonthCustomers || 0) - (lastMonthCustomers || 0)) / (lastMonthCustomers || 1)) * 100).toFixed(1)
    : null;

  // Fulfillment breakdown
  const statusCounts: Record<string, number> = {};
  for (const o of allOrders || []) {
    statusCounts[o.fulfillment_status] = (statusCounts[o.fulfillment_status] || 0) + 1;
  }

  return {
    totalRevenue,
    thisMonthRevenue,
    revenueTrend,
    totalOrders,
    thisMonthOrderCount,
    ordersTrend,
    totalCustomers: totalCustomers || 0,
    thisMonthCustomers: thisMonthCustomers || 0,
    customersTrend,
    totalProducts: totalProducts || 0,
    lowStockCount: lowStockCount || 0,
    pendingOrdersCount: pendingOrders?.length || 0,
    statusCounts,
  };
}

async function getRecentOrders() {
  const admin = getAdmin();
  const { data } = await admin
    .from("orders")
    .select(`
      id, order_number, customer_name, customer_email,
      total_amount, fulfillment_status, payment_status,
      created_at,
      order_items ( id )
    `)
    .order("created_at", { ascending: false })
    .limit(8);
  return data || [];
}

async function getTopProducts() {
  const admin = getAdmin();
  // Aggregate by product_id from order_items
  const { data } = await admin
    .from("order_items")
    .select("product_name, quantity, total_price");

  const map: Record<string, { name: string; qty: number; revenue: number }> = {};
  for (const item of data || []) {
    const key = item.product_name;
    if (!map[key]) map[key] = { name: item.product_name, qty: 0, revenue: 0 };
    map[key].qty     += item.quantity || 0;
    map[key].revenue += item.total_price || 0;
  }

  return Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

// ─── UI helpers ───────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: typeof CheckCircle2 }> = {
  pending:    { label: "Pending",    bg: "bg-yellow-50", text: "text-yellow-700", icon: Clock },
  processing: { label: "Processing", bg: "bg-blue-50",   text: "text-blue-700",   icon: Package },
  shipped:    { label: "Shipped",    bg: "bg-purple-50", text: "text-purple-700", icon: Truck },
  delivered:  { label: "Delivered",  bg: "bg-green-50",  text: "text-green-700",  icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",  bg: "bg-red-50",    text: "text-red-600",    icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function TrendPill({ value }: { value: string | null }) {
  if (value === null) return <span className="text-xs text-gray-400">No prev. data</span>;
  const positive = !value.startsWith("-");
  return (
    <span className={`flex items-center gap-0.5 text-xs font-bold ${positive ? "text-green-600" : "text-red-600"}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? "+" : ""}{value}% this month
    </span>
  );
}

function formatCurrency(v: number) {
  return `Rs.${v.toLocaleString("en-IN")}`;
}

// ─── Page ─────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const [stats, recentOrders, topProducts] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(),
    getTopProducts(),
  ]);

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      sub: `${formatCurrency(stats.thisMonthRevenue)} this month`,
      icon: IndianRupee,
      trend: stats.revenueTrend,
      alert: false,
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      sub: `${stats.thisMonthOrderCount} this month`,
      icon: ShoppingBag,
      trend: stats.ordersTrend,
      alert: stats.pendingOrdersCount > 0,
      alertMsg: `${stats.pendingOrdersCount} pending`,
    },
    {
      label: "Customers",
      value: stats.totalCustomers.toLocaleString(),
      sub: `+${stats.thisMonthCustomers} joined this month`,
      icon: Users,
      trend: stats.customersTrend,
      alert: false,
    },
    {
      label: "Products",
      value: stats.totalProducts.toLocaleString(),
      sub: stats.lowStockCount > 0 ? `${stats.lowStockCount} low stock` : "All stocked",
      icon: Package,
      trend: null,
      alert: stats.lowStockCount > 0,
      alertMsg: `${stats.lowStockCount} low stock`,
      href: "/manager-gora/products"
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Live data — last updated {new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-2 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((s) => {
          const Icon = s.icon;
          const CardContent = (
            <div className={`bg-white border border-gray-100 shadow-sm rounded-xl p-5 flex flex-col gap-3 ${s.href ? 'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</span>
                <div className={`p-2 rounded-lg ${s.alert ? "bg-red-50" : "bg-gray-50"}`}>
                  <Icon className={`w-4 h-4 ${s.alert ? "text-red-500" : "text-gray-600"}`} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 tracking-tight">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
              </div>
              <div className="flex items-center justify-between">
                <TrendPill value={s.trend ?? null} />
                {s.alert && s.alertMsg && (
                  <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                    <AlertTriangle className="w-3 h-3" /> {s.alertMsg}
                  </span>
                )}
              </div>
            </div>
          );

          return s.href ? (
            <Link key={s.label} href={s.href} className="block">
              {CardContent}
            </Link>
          ) : (
            <div key={s.label}>
              {CardContent}
            </div>
          );
        })}
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4">Order Status Breakdown</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = stats.statusCounts[key] || 0;
            const pct = stats.totalOrders > 0 ? ((count / stats.totalOrders) * 100).toFixed(0) : "0";
            return (
              <Link
                key={key}
                href={`/manager-gora/orders?status=${key}`}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${cfg.bg} hover:shadow-sm transition-all flex-1 min-w-[140px]`}
              >
                <cfg.icon className={`w-4 h-4 ${cfg.text}`} />
                <div>
                  <p className={`text-sm font-bold ${cfg.text}`}>{count}</p>
                  <p className="text-xs text-gray-400">{cfg.label} · {pct}%</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main grid: Recent Orders + Top Products */}
      <div className="grid xl:grid-cols-3 gap-6">

        {/* Recent Orders — takes 2/3 */}
        <div className="xl:col-span-2 bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
            <Link href="/manager-gora/orders" className="text-xs font-bold text-[#e32c2b] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link href={`/manager-gora/orders`} className="font-bold text-gray-900 hover:text-[#e32c2b] transition-colors">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-semibold text-gray-800 text-xs">{order.customer_name || "—"}</p>
                          <p className="text-gray-400 text-[11px]">{order.customer_email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={order.fulfillment_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products by Revenue — 1/3 */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Top Products</h2>
            <Link href="/manager-gora/products" className="text-xs font-bold text-[#e32c2b] hover:underline">
              View All
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">No sales data yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topProducts.map((p, i) => (
                <div key={p.name} className="px-5 py-4 flex items-center gap-4">
                  <span className="text-lg font-black text-gray-200 w-6 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.qty} units sold</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(p.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
