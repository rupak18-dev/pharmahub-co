import React from 'react';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';
import { PAYMENT_LOGS } from '../../constants/salesData';

export default function PaymentHistory() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Payment Collection Audit Trail</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time logs for UPI QR, Cash, Card, and Store Credit transactions ({PAYMENT_LOGS.length} records)
        </p>
      </div>

      <div className="saas-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px]">
            <tr>
              <th className="py-3 px-4">Payment ID</th>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Payment Mode</th>
              <th className="py-3 px-4">Txn Reference</th>
              <th className="py-3 px-4">Amount Paid</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {PAYMENT_LOGS.map((pl) => (
              <tr key={pl.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3 px-4 font-bold text-blue-600">{pl.id}</td>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{pl.invoiceId}</td>
                <td className="py-3 px-4 font-sans font-semibold text-slate-700 dark:text-slate-300">{pl.mode}</td>
                <td className="py-3 px-4 text-slate-400">{pl.ref}</td>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">₹{pl.amount.toFixed(2)}</td>
                <td className="py-3 px-4 text-slate-500">{pl.timestamp}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    pl.status === 'Success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {pl.status}
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
