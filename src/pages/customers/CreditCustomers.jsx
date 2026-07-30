import React, { useState } from 'react';
import { CreditCard, Bell, DollarSign, Send } from 'lucide-react';
import { INITIAL_CUSTOMERS } from '../../constants/customerData';

export default function CreditCustomers() {
  const creditAccounts = INITIAL_CUSTOMERS.filter((c) => c.outstandingAmount > 0 || c.creditLimit > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-amber-500" />
          <span>Patient Store Credit Ledgers</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage patient credit limits, outstanding balances, payment due dates, and automated collection reminders
        </p>
      </div>

      <div className="saas-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[11px] font-sans">
            <tr>
              <th className="py-3.5 px-4">Patient Name</th>
              <th className="py-3.5 px-4 font-mono">Phone Number</th>
              <th className="py-3.5 px-4">Credit Limit</th>
              <th className="py-3.5 px-4">Outstanding Bal</th>
              <th className="py-3.5 px-4 font-sans">Due Date</th>
              <th className="py-3.5 px-4 font-sans">Status</th>
              <th className="py-3.5 px-4 text-right font-sans">Collection Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {creditAccounts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">{c.name}</td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{c.phone}</td>
                <td className="py-3.5 px-4 text-slate-500">₹{c.creditLimit.toFixed(2)}</td>
                <td className="py-3.5 px-4 font-bold text-rose-500">₹{c.outstandingAmount.toFixed(2)}</td>
                <td className="py-3.5 px-4 font-sans text-slate-400">{c.dueDate}</td>
                <td className="py-3.5 px-4 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {c.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-sans">
                  <button
                    onClick={() => alert(`Sent payment reminder SMS/WhatsApp to ${c.phone}`)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1 ml-auto"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reminder</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
