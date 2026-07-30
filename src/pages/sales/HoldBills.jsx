import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PauseCircle, Play, Trash2 } from 'lucide-react';
import { HOLD_BILLS } from '../../constants/salesData';

export default function HoldBills() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <PauseCircle className="w-6 h-6 text-amber-500" />
          <span>Held Counter Bills</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Resume paused transactions or customer queue holds ({HOLD_BILLS.length} active)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {HOLD_BILLS.map((hb) => (
          <div key={hb.id} className="saas-card rounded-2xl p-5 space-y-3 border-amber-500/20">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                {hb.id}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{hb.date}</span>
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{hb.customerName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Doctor: {hb.doctorName}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">Reason: {hb.reason}</p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">{hb.itemCount} items</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                  ₹{hb.total.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => navigate('/dashboard/billing/pos')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Play className="w-4 h-4" />
                <span>Resume Sale</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
