import React, { useState } from 'react';
import { PackageCheck, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { GRN_RECORDS } from '../../constants/purchaseData';

export default function GoodsReceivedNote() {
  const [records, setRecords] = useState(GRN_RECORDS);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <PackageCheck className="w-6 h-6 text-emerald-500" />
          <span>Goods Received Note (GRN) Inspection</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Verify physical inward shipments, batch numbers, quantity variances, and damaged stock
        </p>
      </div>

      <div className="saas-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px]">
            <tr>
              <th className="py-3.5 px-4 font-sans">GRN #</th>
              <th className="py-3.5 px-4">PO Reference</th>
              <th className="py-3.5 px-4 font-sans">Supplier Name</th>
              <th className="py-3.5 px-4">Received Date</th>
              <th className="py-3.5 px-4">Verified Qty</th>
              <th className="py-3.5 px-4">Damaged / Short</th>
              <th className="py-3.5 px-4 font-sans">Inspector</th>
              <th className="py-3.5 px-4 font-sans text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {records.map((grn) => (
              <tr key={grn.grnNumber} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3.5 px-4 font-bold text-emerald-500">{grn.grnNumber}</td>
                <td className="py-3.5 px-4 text-blue-600 font-bold">{grn.poNumber}</td>
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">{grn.supplierName}</td>
                <td className="py-3.5 px-4 text-slate-400">{grn.receivedDate}</td>
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{grn.totalReceivedQty} units</td>
                <td className="py-3.5 px-4 font-bold text-amber-500">
                  {grn.damagedQty > 0 ? `${grn.damagedQty} damaged` : 'None'}
                </td>
                <td className="py-3.5 px-4 font-sans text-slate-500 text-[11px]">{grn.verifiedBy}</td>
                <td className="py-3.5 px-4 font-sans text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {grn.status}
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
