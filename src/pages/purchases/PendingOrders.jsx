import React from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { PURCHASE_ORDERS } from '../../constants/purchaseData';

export default function PendingOrders() {
  const pendingOrders = PURCHASE_ORDERS.filter((po) => !po.status.includes('Completed'));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-500" />
          <span>Pending Purchase Orders Watchlist</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Requisitions awaiting owner approval or supplier shipment fulfillment ({pendingOrders.length} active)
        </p>
      </div>

      <div className="saas-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px]">
            <tr>
              <th className="py-3.5 px-4 font-sans">PO Number</th>
              <th className="py-3.5 px-4 font-sans">Supplier Name</th>
              <th className="py-3.5 px-4">Invoice Reference</th>
              <th className="py-3.5 px-4">Order Date</th>
              <th className="py-3.5 px-4 font-sans text-right">Total Amount</th>
              <th className="py-3.5 px-4 font-sans">Status</th>
              <th className="py-3.5 px-4 font-sans text-right">Approval Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {pendingOrders.map((po) => (
              <tr key={po.poNumber} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3.5 px-4 font-bold text-blue-600">{po.poNumber}</td>
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">{po.supplierName}</td>
                <td className="py-3.5 px-4 text-slate-500">{po.invoiceNumber}</td>
                <td className="py-3.5 px-4 text-slate-400">{po.purchaseDate}</td>
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-right">₹{po.total.toFixed(2)}</td>
                <td className="py-3.5 px-4 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {po.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-sans">
                  <div className="flex items-center justify-end gap-1.5">
                    <button className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-bold text-[11px]">
                      Approve
                    </button>
                    <button className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold text-[11px]">
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
