import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  ShoppingCart,
  History,
  PauseCircle,
  FileText,
  RotateCcw,
  CreditCard,
  IndianRupee,
  Plus
} from 'lucide-react';
import { INITIAL_INVOICES, HOLD_BILLS, DRAFT_BILLS } from '../../constants/salesData';

export default function BillingDashboard() {
  const navigate = useNavigate();

  const todayRevenue = INITIAL_INVOICES.reduce((acc, i) => acc + i.grandTotal, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="saas-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-500/5 to-emerald-500/10 border-blue-500/20">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>POS Billing & Sales Hub</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Express counter checkout, invoice history, returns, and payment collection
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard/billing/pos')}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Express POS (New Sale)</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="saas-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Today's POS Sales</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">₹{todayRevenue.toFixed(2)}</h3>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">+14% vs yesterday</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="saas-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Invoices Created</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{INITIAL_INVOICES.length}</h3>
            <p className="text-[10px] text-slate-400 mt-1">100% Tax Compliant</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="saas-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Held Transactions</span>
            <h3 className="text-2xl font-extrabold text-amber-500 mt-0.5">{HOLD_BILLS.length}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Paused billing queues</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <PauseCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="saas-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Draft Invoices</span>
            <h3 className="text-2xl font-extrabold text-indigo-500 mt-0.5">{DRAFT_BILLS.length}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Hospital / Institutional</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { name: 'Express POS Sale', path: '/dashboard/billing/pos', icon: ShoppingCart },
          { name: 'Sales History', path: '/dashboard/billing/history', icon: History },
          { name: 'Hold Bills', path: '/dashboard/billing/hold', icon: PauseCircle, badge: `${HOLD_BILLS.length}` },
          { name: 'Draft Bills', path: '/dashboard/billing/drafts', icon: FileText },
          { name: 'Sales Returns', path: '/dashboard/billing/returns', icon: RotateCcw },
          { name: 'Payment Log', path: '/dashboard/billing/payments', icon: CreditCard },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="saas-card rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-2 hover:border-blue-500/40 group transition-all"
            >
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500 text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
