import React, { useState } from 'react';
import { UserCheck, Stethoscope, FileText, UserPlus, Search } from 'lucide-react';

export const CustomerCard = ({
  customerName,
  setCustomerName,
  doctorName,
  setDoctorName,
  prescriptionNo,
  setPrescriptionNo,
}) => {
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  return (
    <div className="saas-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Patient & Doctor Details</span>
        </h4>
        <button
          type="button"
          onClick={() => setIsAddCustomerOpen(true)}
          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <UserPlus className="w-3 h-3" />
          <span>New Patient</span>
        </button>
      </div>

      <div className="space-y-2 text-xs">
        {/* Customer Input */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Customer / Patient Name (F4)
          </label>
          <div className="relative">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in Customer"
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Doctor Name & Prescription Row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Doctor Name
            </label>
            <div className="relative">
              <Stethoscope className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Self / OTC"
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Rx Number
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={prescriptionNo}
                onChange={(e) => setPrescriptionNo(e.target.value)}
                placeholder="e.g. RX-8841"
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Customer Modal Placeholder */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="saas-card max-w-sm w-full rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Register New Patient</h4>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs"
            />
            <input
              type="text"
              placeholder="Phone Number"
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Save Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
