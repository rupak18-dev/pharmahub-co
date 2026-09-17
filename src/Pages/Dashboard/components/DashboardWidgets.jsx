import { formatDistanceToNow, format } from "date-fns";
import { Link } from "react-router";
import { ShoppingBag, PackageOpen, AlertTriangle, Clock, Users, Activity } from "lucide-react";
import { Badge } from "@/Components/ui/badge";
import { EmptyState } from "@/Components/shared/EmptyState";

export function DashboardWidgets({ db }) {
  const currency = db.settings.currency;
  const recentSales = [...db.sales]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const pendingPOs = db.purchaseOrders
    .filter((po) => po.status === "placed" || po.status === "draft")
    .slice(0, 5);
  const lowStock = db.medicines
    .filter((m) => {
      const stock = db.batches
        .filter((b) => b.medicineId === m.id)
        .reduce((sum, b) => sum + b.currentStock, 0);
      return stock <= m.reorderThreshold;
    })
    .slice(0, 5);
  const expiryMs = (db.settings.nearExpiryDays ?? 90) * 86400000;
  const now = Date.now();
  const expiring = db.batches
    .filter((b) => {
      if (b.currentStock <= 0) return false;
      const t = new Date(b.expiryDate).getTime();
      return t <= now || t - now <= expiryMs;
    })
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 5);
  const uniqueCustomers = Array.from(
    new Set(db.sales.filter((s) => s.customerName).map((s) => s.customerName)),
  );
  const recentCustomers = uniqueCustomers.slice(0, 5);
  const activities = [...db.activityLogs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {/* Pending Purchase Orders Widget */}
      <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <PackageOpen className="h-4 w-4 text-violet-500 shrink-0" />
            <h3 className="text-sm font-semibold truncate">In Queue</h3>
          </div>
          <Link
            to="/purchases"
            className="text-xs font-medium text-violet-600 hover:underline shrink-0"
          >
            View all
          </Link>
        </div>
        <div className="p-0 flex-1">
          {pendingPOs.length > 0 ? (
            <ul className="divide-y divide-border">
              {pendingPOs.map((po) => {
                const supplier = db.suppliers.find((s) => s.id === po.supplierId);
                const total = po.items.reduce((acc, it) => acc + it.quantity * it.expectedPrice, 0);
                return (
                  <li
                    key={po.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{po.poNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {supplier?.name || supplier?.supplierName || "Unknown"} • ETA:{" "}
                        {po.expectedDate ? format(new Date(po.expectedDate), "MMM d") : "N/A"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">
                        {currency}
                        {total.toFixed(2)}
                      </p>
                      <Badge variant="warning" className="text-[10px] mt-1 h-4 px-1.5">
                        {po.status === "placed" || po.status === "draft" ? "In Queue" : po.status}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={PackageOpen}
              title="No orders in queue"
              description="Purchase orders awaiting fulfillment will appear here."
              className="py-8"
            />
          )}
        </div>
      </div>

      {/* Expiring Soon Widget */}
      <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-rose-500 shrink-0" />
            <h3 className="text-sm font-semibold truncate">Expiring Soon</h3>
          </div>
          <Link to="/expiry" className="text-xs font-medium text-rose-600 hover:underline shrink-0">
            View all
          </Link>
        </div>
        <div className="p-0 flex-1">
          {expiring.length > 0 ? (
            <ul className="divide-y divide-border">
              {expiring.map((batch) => {
                const med = db.medicines.find((m) => m.id === batch.medicineId);
                const isExpired = new Date(batch.expiryDate).getTime() < Date.now();
                return (
                  <li
                    key={batch.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {med?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Batch: {batch.batchNumber}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-bold ${isExpired ? "text-destructive" : "text-amber-500"}`}
                      >
                        {format(new Date(batch.expiryDate), "MMM yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">{batch.currentStock} units</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={Clock}
              title="No expiring batches"
              description="Batches nearing expiry will show up here."
              className="py-8"
            />
          )}
        </div>
      </div>

      {/* Low Stock Widget */}
      <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <h3 className="text-sm font-semibold truncate">Low Stock Alerts</h3>
          </div>
          <Link
            to="/inventory"
            className="text-xs font-medium text-amber-600 hover:underline shrink-0"
          >
            View all
          </Link>
        </div>
        <div className="p-0 flex-1">
          {lowStock.length > 0 ? (
            <ul className="divide-y divide-border">
              {lowStock.map((med) => {
                const stock = db.batches
                  .filter((b) => b.medicineId === med.id)
                  .reduce((sum, b) => sum + b.currentStock, 0);
                return (
                  <li
                    key={med.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{med.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Minimum stock: {med.reorderThreshold}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-bold ${stock === 0 ? "text-destructive" : "text-amber-500"}`}
                      >
                        {stock} units
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="Stock levels are healthy"
              description="Medicines at or below their minimum stock will be listed here."
              className="py-8"
            />
          )}
        </div>
      </div>

      {/* Recent Sales Widget */}
      <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-blue-500 shrink-0" />
            <h3 className="text-sm font-semibold truncate">Recent Sales</h3>
          </div>
          <Link to="/sales" className="text-xs font-medium text-blue-600 hover:underline shrink-0">
            View all
          </Link>
        </div>
        <div className="p-0 flex-1">
          {recentSales.length > 0 ? (
            <ul className="divide-y divide-border">
              {recentSales.map((sale) => (
                <li
                  key={sale.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{sale.invoiceNo}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {sale.customerName || "Walk-in"} •{" "}
                      {format(new Date(sale.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">
                      {currency}
                      {sale.grandTotal.toFixed(2)}
                    </p>
                    <Badge
                      variant={sale.status === "completed" ? "success" : "secondary"}
                      className="text-[10px] mt-1 h-4 px-1.5"
                    >
                      {sale.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="No recent sales"
              description="Invoices you generate will appear here."
              className="py-8"
            />
          )}
        </div>
      </div>

      {/* Activity Timeline Widget */}
      <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500 shrink-0" />
            <h3 className="text-sm font-semibold truncate">Activity Timeline</h3>
          </div>
        </div>
        <div className="p-0 flex-1">
          {activities.length > 0 ? (
            <ul className="divide-y divide-border">
              {activities.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{log.action}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {log.userName} • {log.entityType}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Activity}
              title="No recent activity"
              description="Actions across your pharmacy will be tracked here."
              className="py-8"
            />
          )}
        </div>
      </div>

      {/* Recent Customers Widget */}
      <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-500 shrink-0" />
            <h3 className="text-sm font-semibold truncate">Recent Customers</h3>
          </div>
        </div>
        <div className="p-0 flex-1">
          {recentCustomers.length > 0 ? (
            <ul className="divide-y divide-border">
              {recentCustomers.map((customer, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {customer?.charAt(0) || "C"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{customer}</p>
                    <p className="text-xs text-muted-foreground">Retail Customer</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Users}
              title="No customers yet"
              description="Customer names from your sales will appear here."
              className="py-8"
            />
          )}
        </div>
      </div>
    </div>
  );
}
