import React, { useState } from 'react';
import { CalendarOff, AlertTriangle, ArrowRightLeft, RefreshCw, Trash2 } from 'lucide-react';
import { INITIAL_MEDICINES } from '../../constants/inventoryData';

export default function Expiry() {
  const [activeTab, setActiveTab] = useState('30Days'); // 'Expired' | 'Today' | '7Days' | '30Days' | '90Days'

  const now = new Date();

  const getFilteredByDays = (days) => {
    return INITIAL_MEDICINES.filter((m) => {
      const exp = new Date(m.expiryDate);
      const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      if (days === 'Expired') return diffDays < 0;
      if (days === 'Today') return diffDays === 0;
      if (days === '7Days') return diffDays > 0 && diffDays <= 7;
      if (days === '30Days') return diffDays > 0 && diffDays <= 30;
      if (days === '90Days') return diffDays > 0 && diffDays <= 90;
      return true;
    });
  };

  const currentMedicines = getFilteredByDays(activeTab);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarOff className="w-6 h-6 text-rose-500" />
            <span>Expiry Management & Intelligence</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor approaching expiration dates, prevent loss, and initiate vendor returns
          </p>
        </div>
      </div>

      {/* Expiry Time Period Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'Expired', label: 'Expired Items' },
          { id: 'Today', label: 'Expiring Today' },
          { id: '7Days', label: 'Within 7 Days' },
          { id: '30Days', label: 'Within 30 Days' },
          { id: '90Days', label: 'Within 90 Days' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table of Expiry Items */}
      <div className="saas-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Medicine Name</th>
                <th className="py-3.5 px-4">Batch Number</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Remaining Days</th>
                <th className="py-3.5 px-4">Available Qty</th>
                <th className="py-3.5 px-4">Suggested Action</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {currentMedicines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No items found for this expiry period.
                  </td>
                </tr>
              ) : (
                currentMedicines.map((med) => {
                  const expDate = new Date(med.expiryDate);
                  const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
                  const isExpired = daysLeft < 0;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {med.name}
                        <span className="text-[10px] text-slate-400 font-normal block">{med.manufacturer}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {med.batchNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-900 dark:text-white">{med.expiryDate}</td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${isExpired ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'}`}>
                          {isExpired ? 'Expired' : `${daysLeft} days`}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">{med.currentStock} units</td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {isExpired ? 'Quarantine & Dispose' : daysLeft <= 15 ? 'Return to Vendor' : 'Discount Clearance Sale'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold text-xs flex items-center gap-1 ml-auto">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Initiate Return</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
