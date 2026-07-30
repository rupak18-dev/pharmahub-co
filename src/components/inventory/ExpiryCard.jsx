import React from 'react';
import { Calendar, AlertTriangle, ArrowRightLeft } from 'lucide-react';

export const ExpiryCard = ({ medicine }) => {
  const expDate = new Date(medicine.expiryDate);
  const now = new Date();
  const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
  const isCritical = daysLeft <= 30;

  return (
    <div className={`saas-card rounded-2xl p-4 space-y-3 ${isCritical ? 'border-rose-500/40 bg-rose-500/5' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{medicine.name}</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{medicine.manufacturer}</p>
        </div>
        <span
          className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
            isCritical
              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}
        >
          {daysLeft < 0 ? 'Expired' : `${daysLeft} days left`}
        </span>
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-400">Batch #:</span>
          <span className="font-bold text-slate-900 dark:text-white">{medicine.batchNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">In Stock:</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">{medicine.currentStock} units</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Location:</span>
          <span className="text-slate-700 dark:text-slate-300">{medicine.rack} / {medicine.shelf}</span>
        </div>
      </div>

      <button className="w-full mt-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1">
        <ArrowRightLeft className="w-3.5 h-3.5" />
        <span>Return to Vendor</span>
      </button>
    </div>
  );
};
