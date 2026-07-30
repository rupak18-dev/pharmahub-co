import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Play } from 'lucide-react';
import { DRAFT_BILLS } from '../../constants/salesData';

export default function DraftBills() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-500" />
          <span>Draft Invoices</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Unsaved or uncommitted institutional invoices ({DRAFT_BILLS.length} active)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DRAFT_BILLS.map((db) => (
          <div key={db.id} className="saas-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">
                {db.id}
              </span>
              <span className="text-[10px] font-mono text-slate-400">Last saved: {db.lastSaved}</span>
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{db.customerName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{db.itemCount} items included</p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                ₹{db.total.toFixed(2)}
              </span>

              <button
                onClick={() => navigate('/dashboard/billing/pos')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Play className="w-4 h-4" />
                <span>Continue Editing</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
