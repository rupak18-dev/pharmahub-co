import React from 'react';
import { Building2 } from 'lucide-react';
import { INITIAL_SUPPLIERS } from '../../constants/purchaseData';

export default function SupplierReports() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-purple-500" />
          <span>Supplier Procurement & Payables Report</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Distributor purchase volume, outstanding ledger balances, and lead times
        </p>
      </div>

      <div className="saas-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px] font-sans">
            <tr>
              <th className="py-3.5 px-4 font-sans">Supplier Name</th>
              <th className="py-3.5 px-4">GSTIN</th>
              <th className="py-3.5 px-4 font-sans text-right">Outstanding Payables</th>
              <th className="py-3.5 px-4 font-sans">Payment Terms</th>
              <th className="py-3.5 px-4 font-sans">Lead Time</th>
              <th className="py-3.5 px-4 font-sans">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {INITIAL_SUPPLIERS.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">{s.name}</td>
                <td className="py-3.5 px-4 text-blue-600 font-bold">{s.gstin}</td>
                <td className="py-3.5 px-4 text-right font-bold text-rose-500">₹{s.outstandingAmount.toFixed(2)}</td>
                <td className="py-3.5 px-4 font-sans text-slate-700 dark:text-slate-300">{s.paymentTerms}</td>
                <td className="py-3.5 px-4 font-sans text-slate-500">{s.leadTime}</td>
                <td className="py-3.5 px-4 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                    {s.status}
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
