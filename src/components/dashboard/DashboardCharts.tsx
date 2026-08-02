import { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DB } from "@/lib/types";
import { format, subMonths, startOfMonth } from "date-fns";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface DashboardChartsProps {
  db: DB;
}

export function DashboardCharts({ db }: DashboardChartsProps) {
  // Process data for Monthly Sales & Purchases & Revenue
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return {
        date: startOfMonth(d),
        name: format(d, "MMM yyyy"),
        salesAmt: 0,
        purchasesAmt: 0,
        revenue: 0,
      };
    });

    db.sales.forEach((s) => {
      const saleDate = new Date(s.createdAt);
      const m = months.find(
        (month) =>
          month.date.getMonth() === saleDate.getMonth() &&
          month.date.getFullYear() === saleDate.getFullYear()
      );
      if (m) {
        m.salesAmt += s.items.length;
        m.revenue += s.grandTotal;
      }
    });

    db.purchaseOrders.forEach((po) => {
      if (po.status === "received" || po.status === "placed") {
        const poDate = new Date(po.createdAt);
        const m = months.find(
          (month) =>
            month.date.getMonth() === poDate.getMonth() &&
            month.date.getFullYear() === poDate.getFullYear()
        );
        if (m) {
          const total = po.items.reduce((acc, item) => acc + item.quantity * item.expectedPrice, 0);
          m.purchasesAmt += total;
        }
      }
    });

    return months;
  }, [db]);

  // Process data for Top Selling Medicines
  const topMedicines = useMemo(() => {
    const medCounts: Record<string, { name: string; quantity: number }> = {};
    db.sales.forEach((s) => {
      s.items.forEach((item) => {
        if (!medCounts[item.medicineId]) {
          medCounts[item.medicineId] = { name: item.medicineName, quantity: 0 };
        }
        medCounts[item.medicineId].quantity += item.quantity;
      });
    });
    return Object.values(medCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [db]);

  // Process data for Category Distribution
  const categoryDistribution = useMemo(() => {
    const catCounts: Record<string, { name: string; count: number }> = {};
    db.medicines.forEach((m) => {
      if (m.categoryId) {
        const cat = db.categories.find((c) => c.id === m.categoryId);
        const catName = cat ? cat.name : "Other";
        if (!catCounts[catName]) {
          catCounts[catName] = { name: catName, count: 0 };
        }
        catCounts[catName].count += 1;
      }
    });
    return Object.values(catCounts);
  }, [db]);

  const currency = db.settings.currency;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Monthly Revenue - Area Chart */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm xl:col-span-2">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          Revenue by Month
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `${currency}${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}
                formatter={(value: number) => [`${currency}${value.toFixed(2)}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Selling Medicines - Horizontal Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold mb-4">Top Selling Medicines</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topMedicines} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
              <Tooltip 
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}
              />
              <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales vs Purchases - Bar Chart */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:col-span-1 xl:col-span-1">
        <h3 className="text-sm font-semibold mb-4">Sales vs Purchases</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `${currency}${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
              />
              <Tooltip 
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} iconType="circle" />
              <Bar dataKey="revenue" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="purchasesAmt" name="Purchases" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Sales Count - Line Chart */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:col-span-1 xl:col-span-1">
        <h3 className="text-sm font-semibold mb-4">Total Invoices Generated</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}
              />
              <Line type="monotone" dataKey="salesAmt" name="Invoices" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution - Pie Chart */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:col-span-2 xl:col-span-1">
        <h3 className="text-sm font-semibold mb-4">Category Distribution</h3>
        <div className="h-[250px] w-full flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}
              />
              <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: "12px" }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
