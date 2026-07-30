import React from 'react';
import { Award, TrendingUp, AlertTriangle, Activity, Building2 } from 'lucide-react';
import { PerformanceCard } from '../../components/branches/PerformanceCard';
import { INITIAL_BRANCHES } from '../../constants/branchData';

export default function BranchPerformance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Branch Performance Leaderboard</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Executive leaderboard summarizing highest performing locations, inventory flags, and counter activity
        </p>
      </div>

      {/* KPI Performance Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
        <PerformanceCard
          title="Highest Sales Branch"
          value="Kothrud Central"
          subtext="₹45,200.00 sales today"
          icon={TrendingUp}
          color="blue"
        />

        <PerformanceCard
          title="Highest Profit Outlet"
          value="Kothrud Central"
          subtext="38% profit margin index"
          icon={Award}
          color="emerald"
        />

        <PerformanceCard
          title="Lowest Stock Outpost"
          value="Aundh Specialty"
          subtext="15 units low stock warning"
          icon={AlertTriangle}
          color="amber"
        />

        <PerformanceCard
          title="Most Active Branch"
          value="Viman Nagar Outlet"
          subtext="18 transaction entries today"
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Detail Performance Breakdown Table */}
      <div className="saas-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>Branch Operational Efficiencies</span>
        </h3>
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[11px] font-sans">
            <tr>
              <th className="py-2.5 px-3">Branch Outlet Name</th>
              <th className="py-2.5 px-3">Daily Turnover</th>
              <th className="py-2.5 px-3">Active Patients</th>
              <th className="py-2.5 px-3">Delivery Lead Time</th>
              <th className="py-2.5 px-3">Performance Index</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {INITIAL_BRANCHES.map((b) => (
              <tr key={b.id}>
                <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">{b.name}</td>
                <td className="py-2.5 px-3">₹{b.todaysSales.toLocaleString()}</td>
                <td className="py-2.5 px-3 font-sans">350 patients</td>
                <td className="py-2.5 px-3 font-sans">1 Day</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-sans">
                    Excellent (L1)
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
