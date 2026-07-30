import React from 'react';
import { ShoppingCart, Printer } from 'lucide-react';
import { INITIAL_INVOICES } from '../../constants/salesData';

export default function SalesReports() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Detailed POS Sales Report</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit logs for completed sales invoices, cashier registers, and payment modes
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Printer className="w-4 h-4" />
          <span>Print Sales Register</span>
        </button>
      </div>

      <div className="saas-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px] font-sans">
            <tr>
              <th className="py-3.5 px-4 font-mono">Invoice #</th>
              <th className="py-3.5 px-4 font-mono">Date</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Cashier</th>
              <th className="py-3.5 px-4 text-center">Items</th>
              <th className="py-3.5 px-4 text-right">GST (₹)</th>
              <th className="py-3.5 px-4 text-right">Disc (₹)</th>
              <th className="py-3.5 px-4 text-right">Grand Total</th>
              <th className="py-3.5 px-4 font-sans">Payment Mode</th>
              <th className="py-3.5 px-4 font-sans">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {INITIAL_INVOICES.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3.5 px-4 font-bold text-blue-600">{inv.id}</td>
                <td className="py-3.5 px-4 text-slate-400">{inv.date}</td>
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">{inv.customerName}</td>
                <td className="py-3.5 px-4 font-sans text-slate-500">{inv.cashier}</td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">{inv.items.length}</td>
                <td className="py-3.5 px-4 text-right text-slate-500">₹{inv.gstAmount.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right text-rose-500">-₹{inv.discountAmount.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">₹{inv.grandTotal.toFixed(2)}</td>
                <td className="py-3.5 px-4 font-sans font-semibold text-slate-700 dark:text-slate-300">{inv.paymentMode}</td>
                <td className="py-3.5 px-4 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                    {inv.status}
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
