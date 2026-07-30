import React, { useState } from 'react';
import { Wallet, Plus, Minus, CreditCard } from 'lucide-react';
import { WALLET_TRANSACTIONS, INITIAL_CUSTOMERS } from '../../constants/customerData';

export default function CustomerWallet() {
  const [transactions, setTransactions] = useState(WALLET_TRANSACTIONS);
  const totalWallet = INITIAL_CUSTOMERS.reduce((acc, c) => acc + c.walletBalance, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-500" />
            <span>Customer Prepaid Wallets</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pre-funded patient accounts for instant POS checkout ({INITIAL_CUSTOMERS.length} registered wallets)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Top-up customer wallet modal trigger.')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Top-Up Wallet</span>
          </button>
        </div>
      </div>

      <div className="saas-card rounded-2xl p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-blue-500/10 border-emerald-500/20 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Pharmacy Prepaid Pool</span>
          <h2 className="text-3xl font-extrabold font-mono text-emerald-500 mt-0.5">₹{totalWallet.toFixed(2)}</h2>
          <p className="text-xs text-slate-500 mt-1">Instant deduction available at POS billing counters</p>
        </div>

        <Wallet className="w-12 h-12 text-emerald-500/40" />
      </div>

      <div className="saas-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Wallet Activity Log</h3>
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px]">
            <tr>
              <th className="py-2.5 px-3 font-sans">Txn ID</th>
              <th className="py-2.5 px-3 font-sans">Patient Name</th>
              <th className="py-2.5 px-3 font-sans">Type</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Balance After</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3 font-sans">Payment Mode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {transactions.map((wt) => (
              <tr key={wt.id}>
                <td className="py-2.5 px-3 font-bold text-blue-600">{wt.id}</td>
                <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">{wt.customerName}</td>
                <td className="py-2.5 px-3 font-sans">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    wt.type.includes('Top-up') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {wt.type}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-bold">₹{wt.amount.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-slate-500">₹{wt.balanceAfter.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-slate-400">{wt.date}</td>
                <td className="py-2.5 px-3 font-sans text-slate-500">{wt.mode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
