import React, { useState } from 'react';
import { Zap, CheckCircle2, XCircle } from 'lucide-react';
import { PENDING_APPROVALS } from '../../constants/notificationData';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState(PENDING_APPROVALS);

  const handleDecision = (id, decision) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    alert(`Requisition ${id} ${decision}!`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" />
          <span>Pending Management Approvals</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Owner approvals for purchase orders, stock write-offs, returns, and customer credit extensions
        </p>
      </div>

      <div className="space-y-3">
        {approvals.length === 0 ? (
          <div className="saas-card rounded-2xl p-8 text-center text-xs text-slate-400">
            No pending approval requisitions.
          </div>
        ) : (
          approvals.map((app) => (
            <div key={app.id} className="saas-card rounded-2xl p-5 space-y-3 border-amber-500/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-mono">
                  {app.type}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{app.date}</span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{app.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Submitted by: <strong>{app.submittedBy}</strong></p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 text-xs">
                <button
                  onClick={() => handleDecision(app.id, 'Rejected')}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleDecision(app.id, 'Approved')}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Requisition</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
