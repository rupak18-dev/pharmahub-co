import React from 'react';
import { Users, Award, CreditCard } from 'lucide-react';
import { TOP_CUSTOMERS_DATA } from '../../constants/reportsData';
import { INITIAL_CUSTOMERS } from '../../constants/customerData';

export default function CustomerReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Customer & Patient Analytics Report</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Patient lifetime value rankings, active credit accounts, and loyalty standings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="saas-card rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Most Valuable Patients (Highest Lifetime Revenue)</span>
          </h3>
          <div className="space-y-2 text-xs font-mono">
            {TOP_CUSTOMERS_DATA.map((c) => (
              <div key={c.name} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-sans">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                  <p className="text-[10px] text-amber-500 font-bold">{c.tier} • {c.orderCount} orders</p>
                </div>
                <span className="font-mono font-extrabold text-emerald-500 text-sm">₹{c.totalSpent.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="saas-card rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-rose-500" />
            <span>Credit Account Outstanding Ledgers</span>
          </h3>
          <div className="space-y-2 text-xs font-mono">
            {INITIAL_CUSTOMERS.filter((c) => c.outstandingAmount > 0).map((c) => (
              <div key={c.name} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-sans">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Phone: {c.phone}</p>
                </div>
                <span className="font-mono font-extrabold text-rose-500 text-sm">₹{c.outstandingAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
