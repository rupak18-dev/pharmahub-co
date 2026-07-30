import React from 'react';
import { Package, Calendar, DollarSign } from 'lucide-react';

export const BatchCard = ({ batch }) => {
  const isExpiring = batch.status === 'Expiring Soon';
  const isExhausted = batch.quantity === 0;

  return (
    <div className={`saas-card rounded-2xl p-4 space-y-3 ${isExpiring ? 'border-amber-500/30' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white font-mono">{batch.batchNumber}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{batch.medicineName}</p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isExhausted
              ? 'bg-slate-200 text-slate-600 border-slate-300'
              : isExpiring
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
          }`}
        >
          {batch.status}
        </span>
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
        <div>
          <span className="text-slate-400 text-[10px]">Mfd Date:</span>
          <p className="text-slate-700 dark:text-slate-300">{batch.mfdDate}</p>
        </div>
        <div>
          <span className="text-slate-400 text-[10px]">Expiry Date:</span>
          <p className="text-slate-900 dark:text-white font-bold">{batch.expiryDate}</p>
        </div>
        <div>
          <span className="text-slate-400 text-[10px]">Available Qty:</span>
          <p className="text-blue-600 dark:text-blue-400 font-bold">{batch.quantity} units</p>
        </div>
        <div>
          <span className="text-slate-400 text-[10px]">Selling Price:</span>
          <p className="text-slate-900 dark:text-white font-bold">₹{batch.sellingPrice.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};
