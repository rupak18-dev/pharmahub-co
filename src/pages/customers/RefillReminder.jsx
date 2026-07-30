import React, { useState } from 'react';
import { Clock, Send, CheckCircle2 } from 'lucide-react';
import { REFILL_REMINDERS } from '../../constants/customerData';

export default function RefillReminder() {
  const [reminders, setReminders] = useState(REFILL_REMINDERS);

  const handleSendReminder = (id) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'SMS Sent' } : r))
    );
    alert('Refill notification dispatched to patient phone.');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-purple-500" />
          <span>Chronic Medication Refill Intelligence</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Proactive automated refill reminders for diabetic, cardiac, and chronic care patients
        </p>
      </div>

      <div className="saas-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[11px] font-sans">
            <tr>
              <th className="py-3.5 px-4">Patient Name</th>
              <th className="py-3.5 px-4">Phone Number</th>
              <th className="py-3.5 px-4">Chronic Medicine</th>
              <th className="py-3.5 px-4 text-center">Days Remaining</th>
              <th className="py-3.5 px-4">Reminder Due Date</th>
              <th className="py-3.5 px-4 font-sans">Status</th>
              <th className="py-3.5 px-4 text-right font-sans">Dispatch Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {reminders.map((ref) => (
              <tr key={ref.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">{ref.customerName}</td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{ref.phone}</td>
                <td className="py-3.5 px-4 font-bold text-blue-600">{ref.medicineName}</td>
                <td className="py-3.5 px-4 text-center font-bold">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    ref.daysRemaining <= 1 ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
                  }`}>
                    {ref.daysRemaining} days left
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-400">{ref.reminderDate}</td>
                <td className="py-3.5 px-4 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    {ref.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-sans">
                  <button
                    onClick={() => handleSendReminder(ref.id)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 ml-auto shadow-md shadow-purple-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send WhatsApp Alert</span>
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
