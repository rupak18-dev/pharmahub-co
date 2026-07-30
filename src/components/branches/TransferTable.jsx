import React from 'react';
import { Check, X, ArrowRight } from 'lucide-react';

export const TransferTable = ({ transfers = [], onStatusUpdate }) => {
  return (
    <div className="saas-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px] font-sans">
            <tr>
              <th className="py-3 px-4">Transfer ID</th>
              <th className="py-3 px-4">Source Location</th>
              <th className="py-3 px-4 text-center">Direction</th>
              <th className="py-3 px-4">Destination Outlet</th>
              <th className="py-3 px-4 text-center">Items</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 font-sans">Approved By</th>
              <th className="py-3 px-4 font-sans">Status</th>
              {onStatusUpdate && <th className="py-3 px-4 font-sans text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {transfers.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3 px-4 font-bold text-blue-600">{t.id}</td>
                <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">{t.fromBranch}</td>
                <td className="py-3 px-4 text-center text-slate-400">
                  <ArrowRight className="w-4 h-4 mx-auto text-blue-600" />
                </td>
                <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">{t.toBranch}</td>
                <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">{t.medicineCount} item(s)</td>
                <td className="py-3 px-4 text-slate-400">{t.date}</td>
                <td className="py-3 px-4 font-sans text-slate-500 text-[11px]">{t.approvedBy}</td>
                <td className="py-3 px-4 font-sans">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.status.includes('Delivered')
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {t.status}
                  </span>
                </td>
                {onStatusUpdate && (
                  <td className="py-3 px-4 text-right font-sans">
                    {t.status === 'In Transit' && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onStatusUpdate(t.id, 'Delivered & Restocked')}
                          className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-bold text-[10px] flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Receive</span>
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
