import React, { useState } from 'react';
import { RotateCcw, Search, Check, AlertTriangle } from 'lucide-react';
import { SALES_RETURNS, INITIAL_INVOICES } from '../../constants/salesData';

export default function SalesReturns() {
  const [returns, setReturns] = useState(SALES_RETURNS);
  const [invoiceIdSearch, setInvoiceIdSearch] = useState('INV-9021');
  const [reason, setReason] = useState('Wrong Medicine Dispensed');
  const [selectedInvoice, setSelectedInvoice] = useState(INITIAL_INVOICES[0]);

  const handleProcessReturn = (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const newReturn = {
      id: `RET-${Math.floor(300 + Math.random() * 900)}`,
      originalInvoiceId: selectedInvoice.id,
      date: new Date().toLocaleString(),
      customerName: selectedInvoice.customerName,
      refundAmount: selectedInvoice.grandTotal,
      reason,
      refundMode: 'Cash Refund',
      status: 'Completed & Stock Restored',
    };
    setReturns((prev) => [newReturn, ...prev]);
    alert(`Return processed successfully for ${selectedInvoice.id}! Stock updated.`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-rose-500" />
          <span>Sales Returns & Refund Processing</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Process customer medicine returns, issue instant refunds, and update inventory stock
        </p>
      </div>

      {/* Process Return Form */}
      <div className="saas-card rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
          Initiate Invoice Return
        </h3>

        <form onSubmit={handleProcessReturn} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Enter Invoice Number *
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={invoiceIdSearch}
                  onChange={(e) => setInvoiceIdSearch(e.target.value)}
                  placeholder="e.g. INV-9021"
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Return Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
              >
                <option value="Wrong Medicine Dispensed">Wrong Medicine Dispensed</option>
                <option value="Damaged Packaging">Damaged Packaging</option>
                <option value="Patient Refused">Patient Refused / Order Canceled</option>
                <option value="Near Expiry">Near Expiry Return</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Return & Restore Stock</span>
            </button>
          </div>
        </form>
      </div>

      {/* History Log */}
      <div className="saas-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Processed Sales Returns Log</h3>
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase">
            <tr>
              <th className="py-2.5 px-3">Return ID</th>
              <th className="py-2.5 px-3">Original Invoice</th>
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">Refund Amount</th>
              <th className="py-2.5 px-3">Reason</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {returns.map((ret) => (
              <tr key={ret.id}>
                <td className="py-2.5 px-3 font-bold text-rose-500">{ret.id}</td>
                <td className="py-2.5 px-3 text-blue-600 font-bold">{ret.originalInvoiceId}</td>
                <td className="py-2.5 px-3 font-sans text-slate-900 dark:text-white font-bold">{ret.customerName}</td>
                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">₹{ret.refundAmount.toFixed(2)}</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">{ret.reason}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">
                    {ret.status}
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
