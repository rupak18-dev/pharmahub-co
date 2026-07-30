import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Stethoscope, User, Download, Printer } from 'lucide-react';
import { PRESCRIPTIONS } from '../../constants/customerData';

export default function PrescriptionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const rx = PRESCRIPTIONS.find((p) => p.id === id) || PRESCRIPTIONS[0];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/customers/prescriptions')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Prescription Vault</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <Printer className="w-4 h-4" />
            <span>Print Rx Details</span>
          </button>
        </div>
      </div>

      {/* Prescription Document Card */}
      <div className="saas-card rounded-2xl p-6 space-y-5 font-mono text-xs">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 font-sans uppercase">Prescription Reference</span>
            <h2 className="font-extrabold text-xl text-blue-600">{rx.id}</h2>
            <p className="text-slate-500 font-sans mt-0.5">Date: {rx.date}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold font-sans bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            {rx.status}
          </span>
        </div>

        {/* Doctor & Patient Split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 font-sans">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Prescribing Doctor</span>
            </span>
            <p className="font-bold text-slate-900 dark:text-white">{rx.doctorName}</p>
            <p className="text-slate-500 text-[11px]">{rx.hospitalName}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Patient Profile</span>
            </span>
            <p className="font-bold text-slate-900 dark:text-white">{rx.customerName}</p>
            <p className="text-slate-500 text-[11px]">ID: {rx.customerId}</p>
          </div>
        </div>

        {/* Prescribed Medicines List */}
        <div className="space-y-3 font-sans">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Prescribed Medicines & Dosage Instructions</h3>
          <div className="space-y-2">
            {rx.medicines.map((m, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{m.name}</h4>
                  <p className="text-slate-500 font-mono text-[11px]">Dosage: <strong>{m.dosage}</strong></p>
                  <p className="text-slate-400 text-[11px] italic">Notes: {m.notes}</p>
                </div>
                <span className="font-mono font-bold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-lg">
                  {m.duration}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Attachment Scanner Box */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-sans">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Attached Scan: {rx.attachment}</span>
          </div>
          <button
            onClick={() => alert(`Downloading scanned prescription PDF: ${rx.attachment}`)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
