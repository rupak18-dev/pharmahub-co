import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PURCHASE_ORDERS } from '../../constants/purchaseData';

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'

  const filtered = PURCHASE_ORDERS.filter((po) =>
    activeTab === 'pending' ? po.status.includes('Pending') || po.status.includes('Approved') : po.status.includes('Completed')
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Purchase Orders (PO)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage purchase requisitions, approvals, vendor POs, and stock inward orders
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard/purchases/new')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New PO</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pending'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          Pending PO Requisitions ({PURCHASE_ORDERS.filter((p) => !p.status.includes('Completed')).length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'completed'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          Completed Orders ({PURCHASE_ORDERS.filter((p) => p.status.includes('Completed')).length})
        </button>
      </div>

      <div className="saas-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4 font-sans">PO Number</th>
              <th className="py-3 px-4 font-sans">Supplier Name</th>
              <th className="py-3 px-4">Invoice Ref</th>
              <th className="py-3 px-4">PO Date</th>
              <th className="py-3 px-4 font-sans text-right">Total Amount</th>
              <th className="py-3 px-4 font-sans">Status</th>
              <th className="py-3 px-4 font-sans text-right">Approval Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.map((po) => (
              <tr key={po.poNumber}>
                <td className="py-3 px-4 font-bold text-blue-600">{po.poNumber}</td>
                <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">{po.supplierName}</td>
                <td className="py-3 px-4 text-slate-500">{po.invoiceNumber}</td>
                <td className="py-3 px-4 text-slate-400">{po.purchaseDate}</td>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white text-right">₹{po.total.toFixed(2)}</td>
                <td className="py-3 px-4 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {po.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-sans">
                  <div className="flex items-center justify-end gap-1.5">
                    <button className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold text-[11px] flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
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
