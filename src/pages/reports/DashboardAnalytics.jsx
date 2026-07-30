import React from 'react';
import { TrendingUp, ShoppingBag, Users, Building2, Award } from 'lucide-react';
import { SalesTrendChart } from '../../components/reports/charts/SalesTrendChart';
import { CategoryPieChart } from '../../components/reports/charts/CategoryPieChart';
import { ComparisonBarChart } from '../../components/reports/charts/ComparisonBarChart';
import { TOP_SELLING_MEDICINES, TOP_CUSTOMERS_DATA, TOP_SUPPLIERS_DATA } from '../../constants/reportsData';

export default function DashboardAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Executive Dashboard Analytics</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          High-level executive metrics, product velocity rankings, and category performance
        </p>
      </div>

      {/* Chart Row 1: Sales vs Purchase Comparison Bar & Revenue Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="saas-card rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Monthly Sales Revenue vs. Inward Purchases</h3>
          <ComparisonBarChart />
        </div>
        <div className="saas-card rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Gross Revenue & Profit Trend Analysis</h3>
          <SalesTrendChart />
        </div>
      </div>

      {/* Top Rankings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Top Selling Medicines */}
        <div className="saas-card rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span>Top Selling Medicines</span>
          </h3>
          <div className="space-y-2 text-xs">
            {TOP_SELLING_MEDICINES.map((med) => (
              <div key={med.name} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">#{med.rank} {med.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{med.salesCount} units sold</p>
                </div>
                <span className="font-mono font-bold text-blue-600">₹{med.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="saas-card rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <span>Top Patients by Lifetime Value</span>
          </h3>
          <div className="space-y-2 text-xs">
            {TOP_CUSTOMERS_DATA.map((c) => (
              <div key={c.name} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                  <p className="text-[10px] text-amber-500 font-bold">{c.tier}</p>
                </div>
                <span className="font-mono font-bold text-emerald-500">₹{c.totalSpent.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="saas-card rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-500" />
            <span>Top Procurement Suppliers</span>
          </h3>
          <div className="space-y-2 text-xs">
            {TOP_SUPPLIERS_DATA.map((s) => (
              <div key={s.name} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{s.ordersCount} PO orders</p>
                </div>
                <span className="font-mono font-bold text-purple-500">₹{s.totalPurchase.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
