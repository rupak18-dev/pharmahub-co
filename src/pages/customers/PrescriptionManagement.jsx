import React, { useState } from 'react';
import { FileText, Plus, Search } from 'lucide-react';
import { PRESCRIPTIONS } from '../../constants/customerData';
import { PrescriptionTable } from '../../components/customers/PrescriptionTable';

export default function PrescriptionManagement() {
  const [prescriptions, setPrescriptions] = useState(PRESCRIPTIONS);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Digital Prescription Vault (Rx)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Store doctor prescriptions, dosages, duration instructions, and scanned files ({prescriptions.length} records)
          </p>
        </div>

        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20">
          <Plus className="w-4 h-4" />
          <span>Upload Prescription</span>
        </button>
      </div>

      <PrescriptionTable prescriptions={prescriptions} />
    </div>
  );
}
