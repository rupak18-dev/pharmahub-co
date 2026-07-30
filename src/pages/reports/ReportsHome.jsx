import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Building2,
  AlertTriangle,
  Receipt,
  PieChart,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { SalesTrendChart } from '../../components/reports/charts/SalesTrendChart';
import { CategoryPieChart } from '../../components/reports/charts/CategoryPieChart';

export default function ReportsHome() {
  const navigate = useNavigate();

  const reportModules = [
    { title: 'Executive Analytics', path: '/dashboard/reports/analytics', icon: TrendingUp, desc: '360° Business trends & KPIs' },
    { title: 'Sales & Revenue', path: '/dashboard/reports/sales', icon: ShoppingCart, desc: 'POS sales volume & register audit' },
    { title: 'Inward Purchases', path: '/dashboard/reports/purchases', icon: Package, desc: 'Vendor invoices & procurement' },
    { title: 'Inventory Valuation', path: '/dashboard/reports/inventory', icon: BarChart3, desc: 'Stock value, batch & warehouse' },
    { title: 'Profit & Loss (P&L)', path: '/dashboard/reports/profit-loss', icon: DollarSign, desc: 'Revenue vs. COGS & net margins' },
    { title: 'GST & Tax Returns', path: '/dashboard/reports/gst', icon: Receipt, desc: 'GSTR-1, GSTR-3B & HSN summaries' },
    { title: 'Expiry Intelligence', path: '/dashboard/reports/expiry', icon: AlertTriangle, desc: 'Loss prevention & vendor returns' },
    { title: 'Low Stock Reorders', path: '/dashboard/reports/low-stock', icon: SlidersHorizontal, desc: 'Stock depletion & threshold alerts' },
    { title: 'Customer Lifetime Value', path: '/dashboard/reports/customers', icon: Users, desc: 'Patient retention & credit ledgers' },
    { title: 'Supplier Procurement', path: '/dashboard/reports/suppliers', icon: Building2, desc: 'Vendor performance & lead times' },
    { title: 'Custom Report Builder', path: '/dashboard/reports/builder', icon: PieChart, desc: 'Ad-hoc data builder & export' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>SaaS Analytics & Business Intelligence</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time financial performance, inventory valuation, GST compliance, and predictive sales analytics
        </p>
      </div>

      {/* 10 Dashboard Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-sans">
        {[
          { label: "Today's Sales", val: '₹14,250', color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Monthly Sales', val: '₹745,000', color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Monthly Purchase', val: '₹450,000', color: 'text-amber-500' },
          { label: 'Gross Profit', val: '₹295,000', color: 'text-emerald-500' },
          { label: 'Net Profit', val: '₹150,000', color: 'text-emerald-500' },
          { label: 'Inventory Value', val: '₹1,420,000', color: 'text-purple-500' },
          { label: 'Total Customers', val: '1,240', color: 'text-slate-900 dark:text-white' },
          { label: 'Active Suppliers', val: '14', color: 'text-slate-900 dark:text-white' },
          { label: 'Vendor Payables', val: '₹73,100', color: 'text-rose-500' },
          { label: 'Patient Receivables', val: '₹12,400', color: 'text-amber-500' },
        ].map((card, idx) => (
          <div key={idx} className="saas-card rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block">{card.label}</span>
            <h3 className={`text-lg font-extrabold font-mono ${card.color}`}>{card.val}</h3>
          </div>
        ))}
      </div>

      {/* Embedded Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 saas-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Revenue & Profit Trends (YTD)</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600">Updated Real-time</span>
          </div>
          <SalesTrendChart />
        </div>

        <div className="saas-card rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Drug Category Revenue Share</h3>
          <CategoryPieChart />
        </div>
      </div>

      {/* Report Module Navigation Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select Analytics & Reporting Module</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportModules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.path}
                onClick={() => navigate(m.path)}
                className="saas-card rounded-2xl p-4 flex items-center justify-between hover:border-blue-500/40 group cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {m.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">{m.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
