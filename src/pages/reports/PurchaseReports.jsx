import React from 'react';
import { Package, Printer } from 'lucide-react';
import { PURCHASE_ORDERS } from '../../constants/purchaseData';

export default function PurchaseReports() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            <span>Inward Procurement & Purchase Report</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit history of supplier shipments and wholesale PO expenditures
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Printer className="w-4 h-4" />
          <span>Print Purchase Register</span>
        </button>
      </div>

      <div className="saas-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px] font-sans">
            <tr>
              <th className="py-3.5 px-4 font-mono">PO Number</th>
              <th className="py-3.5 px-4">Supplier Name</th>
              <th className="py-3.5 px-4 font-mono">Purchase Date</th>
              <th className="py-3.5 px-4 font-mono text-center">Items Count</th>
              <th className="py-3.5 px-4 text-right">Inward GST (12%)</th>
              <th className="py-3.5 px-4 text-right">Total Payable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {PURCHASE_ORDERS.map((po) => (
              <tr key={po.poNumber} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3.5 px-4 font-bold text-blue-600">{po.poNumber}</td>
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">{po.supplierName}</td>
                <td className="py-3.5 px-4 text-slate-400">{po.purchaseDate}</td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">{po.itemsCount}</td>
                <td className="py-3.5 px-4 text-right text-slate-500">₹{(po.total * 0.12).toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">₹{po.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
