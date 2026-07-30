import React, { useState } from 'react';
import { User, Plus } from 'lucide-react';
import { INITIAL_DESIGNATIONS } from '../../constants/userData';

export default function Designation() {
  const [designations, setDesignations] = useState(INITIAL_DESIGNATIONS);

  const handleAddDes = () => {
    alert('Create employee designation modal trigger.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Employee Designations Blueprint</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure system classifications (*Manager, Cashier, Pharmacist, Store Keeper, Warehouse Staff, Accountant, Sales Executive*)
          </p>
        </div>

        <button
          onClick={handleAddDes}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Designation</span>
        </button>
      </div>

      <div className="saas-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px] font-sans">
            <tr>
              <th className="py-2.5 px-3">Designation Name</th>
              <th className="py-2.5 px-3">Designation Code</th>
              <th className="py-2.5 px-3 text-center">User Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
            {designations.map((des) => (
              <tr key={des.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3 px-3 font-sans font-bold text-slate-900 dark:text-white">{des.name}</td>
                <td className="py-3 px-3 text-blue-600 font-bold">{des.code}</td>
                <td className="py-3 px-3 text-center text-slate-950 dark:text-white font-bold">{des.userCount} member(s)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
