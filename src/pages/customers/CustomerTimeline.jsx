import React from 'react';
import { History, ShoppingBag, RotateCcw, Wallet, FileText, Award } from 'lucide-react';

export default function CustomerTimeline() {
  const events = [
    { type: 'Purchase', title: 'Invoice INV-9021 Completed', desc: 'Purchased Dolo 650mg & Pan 40mg (₹208.00)', time: '2026-07-30 10:45 AM', icon: ShoppingBag, color: 'text-blue-500 bg-blue-500/10' },
    { type: 'Prescription', title: 'New Rx Uploaded', desc: 'Dr. S. Mehta uploaded prescription RX-99120', time: '2026-07-30 09:30 AM', icon: FileText, color: 'text-indigo-500 bg-indigo-500/10' },
    { type: 'Wallet', title: 'Prepaid Wallet Top-up', desc: 'Ramesh Sharma added ₹1,000 via UPI QR', time: '2026-07-28 02:15 PM', icon: Wallet, color: 'text-emerald-500 bg-emerald-500/10' },
    { type: 'Return', title: 'Sales Return Claimed', desc: 'Returned 1 unit Pan 40mg (INV-9015)', time: '2026-07-27 11:00 AM', icon: RotateCcw, color: 'text-rose-500 bg-rose-500/10' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Patient Activity & Audit Timeline</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Unified audit trail combining purchases, returns, wallet top-ups, prescriptions, and loyalty events
        </p>
      </div>

      <div className="saas-card rounded-2xl p-6 space-y-4">
        <div className="space-y-4 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {events.map((ev, idx) => {
            const Icon = ev.icon;
            return (
              <div key={idx} className="flex items-start gap-4 relative pl-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold z-10 ${ev.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-1 space-y-1 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="font-bold text-slate-900 dark:text-white font-sans">{ev.title}</span>
                    <span className="text-slate-400 text-[10px]">{ev.time}</span>
                  </div>
                  <p className="text-slate-500">{ev.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
