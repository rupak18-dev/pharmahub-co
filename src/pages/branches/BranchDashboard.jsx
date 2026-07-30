import React from 'react';
import { Building2, ShoppingBag, Receipt, IndianRupee } from 'lucide-react';
import { INITIAL_BRANCHES } from '../../constants/branchData';

export default function BranchDashboard() {
  const localBranch = INITIAL_BRANCHES[0]; // Kothrud Central Pharmacy

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="saas-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-500/5 to-purple-500/10 border-blue-500/20">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Local Branch Portal: {localBranch.name}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manager View • Code: <strong className="font-mono">{localBranch.code}</strong> • Terminal Counter #01
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Today's Local Counter Sales</span>
          <h3 className="text-2xl font-extrabold text-blue-600">₹{localBranch.todaysSales.toLocaleString()}</h3>
        </div>

        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Local Stock Valuation</span>
          <h3 className="text-2xl font-extrabold text-purple-600">₹{localBranch.currentStockValue.toLocaleString()}</h3>
        </div>

        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Terminal Status</span>
          <h3 className="text-2xl font-extrabold text-emerald-500 font-sans">Counter Active</h3>
        </div>
      </div>
    </div>
  );
}
