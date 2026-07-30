import React from 'react';
import { Eye, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrescriptionTable = ({ prescriptions = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="saas-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px] font-sans">
            <tr>
              <th className="py-3.5 px-4">Rx Number</th>
              <th className="py-3.5 px-4">Customer Name</th>
              <th className="py-3.5 px-4">Prescribing Doctor</th>
              <th className="py-3.5 px-4">Rx Date</th>
              <th className="py-3.5 px-4 text-center">Medicines</th>
              <th className="py-3.5 px-4 font-sans">Status</th>
              <th className="py-3.5 px-4 text-right font-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {prescriptions.map((rx) => (
              <tr key={rx.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3.5 px-4 font-bold text-blue-600">{rx.id}</td>
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">{rx.customerName}</td>
                <td className="py-3.5 px-4 font-sans text-slate-700 dark:text-slate-300">{rx.doctorName}</td>
                <td className="py-3.5 px-4 text-slate-400">{rx.date}</td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                  {rx.medicineCount} items
                </td>
                <td className="py-3.5 px-4 font-sans">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {rx.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-sans">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/dashboard/customers/prescriptions/${rx.id}`)}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                      title="View Prescription Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => alert(`Download PDF attachment ${rx.attachment}`)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      title="Download Scan"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
