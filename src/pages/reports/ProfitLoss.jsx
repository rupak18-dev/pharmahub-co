import React from 'react';
import { DollarSign, TrendingUp, Printer } from 'lucide-react';
import { PROFIT_LOSS_BREAKDOWN } from '../../constants/reportsData';

export default function ProfitLoss() {
  const pnl = PROFIT_LOSS_BREAKDOWN;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            <span>Profit & Loss Statement (P&L)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Financial income statement summarizing sales revenues, COGS, and operating net margins
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Printer className="w-4 h-4" />
          <span>Print Financial P&L</span>
        </button>
      </div>

      {/* P&L Financial Card */}
      <div className="saas-card rounded-2xl p-6 space-y-6 font-mono text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-baseline font-sans">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Gross Revenue (Sales Invoices)</h3>
          <span className="font-mono font-extrabold text-base text-blue-600">₹{pnl.revenue.toFixed(2)}</span>
        </div>

        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-baseline font-sans">
          <h3 className="font-semibold text-slate-500">Less: Cost of Goods Sold (COGS Purchases)</h3>
          <span className="font-mono font-bold text-rose-500">-₹{pnl.cogs.toFixed(2)}</span>
        </div>

        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex justify-between items-center font-sans">
          <span className="font-extrabold text-slate-900 dark:text-white text-sm">GROSS PROFIT MARGIN</span>
          <span className="font-mono font-extrabold text-xl text-blue-600">₹{pnl.grossProfit.toFixed(2)}</span>
        </div>

        {/* Operating Expenses */}
        <div className="space-y-2 font-sans pt-2">
          <h4 className="font-bold text-slate-700 dark:text-slate-300">Operating Expenses & Overheads:</h4>
          <div className="space-y-1 text-slate-500 font-mono">
            <div className="flex justify-between">
              <span>Branch Property Rent:</span>
              <span>₹{pnl.operatingExpenses.rent.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Staff Salaries & Payroll:</span>
              <span>₹{pnl.operatingExpenses.salaries.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Utilities & Electricity:</span>
              <span>₹{pnl.operatingExpenses.utilities.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Software & PharmaHub SaaS:</span>
              <span>₹{pnl.operatingExpenses.softwareSaas.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center font-sans">
          <span className="font-extrabold text-slate-900 dark:text-white text-base">NET OPERATING PROFIT</span>
          <span className="font-mono font-extrabold text-2xl text-emerald-500">₹{pnl.netProfit.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
