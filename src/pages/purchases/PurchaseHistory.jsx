import React, { useState } from 'react';
import { ShoppingBag, Eye, Printer } from 'lucide-react';
import { PURCHASE_ORDERS } from '../../constants/purchaseData';

export default function PurchaseHistory() {
  const [orders, setOrders] = useState(PURCHASE_ORDERS);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Purchase History & Inward Invoices</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Audit history of all inward purchase orders and vendor shipments ({orders.length} records)
        </p>
      </div>

      <div className="saas-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[11px]">
            <tr>
              <th className="py-3.5 px-4 font-sans">PO Number</th>
              <th className="py-3.5 px-4 font-sans">Supplier</th>
              <th className="py-3.5 px-4">Invoice #</th>
              <th className="py-3.5 px-4">Purchase Date</th>
              <th className="py-3.5 px-4 font-sans text-right">Total Amount</th>
              <th className="py-3.5 px-4 font-sans">Status</th>
              <th className="py-3.5 px-4 font-sans">Created By</th>
              <th className="py-3.5 px-4 font-sans text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {orders.map((po) => (
              <tr key={po.poNumber} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3.5 px-4 font-bold text-blue-600">{po.poNumber}</td>
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">{po.supplierName}</td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{po.invoiceNumber}</td>
                <td className="py-3.5 px-4 text-slate-400">{po.purchaseDate}</td>
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-right">₹{po.total.toFixed(2)}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-sans bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {po.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-sans text-slate-500 text-[11px]">{po.createdBy}</td>
                <td className="py-3.5 px-4 text-right">
                  <button className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
