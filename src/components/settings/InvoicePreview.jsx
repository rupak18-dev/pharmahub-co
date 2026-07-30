import React from 'react';

export const InvoicePreview = ({ prefix, suffix, startNumber, paperSize, showLogo }) => {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white text-slate-900 text-[10px] space-y-2 max-w-xs shadow">
      <div className="flex justify-between items-center border-b pb-1.5 font-sans">
        <span className="font-bold uppercase tracking-wider">Tax Invoice</span>
        {showLogo && <span className="text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">LOGO</span>}
      </div>

      <div className="font-mono space-y-0.5 text-slate-500">
        <div className="flex justify-between">
          <span>Invoice No:</span>
          <span className="font-bold text-slate-900">{prefix}{startNumber}{suffix}</span>
        </div>
        <div className="flex justify-between">
          <span>Date / Time:</span>
          <span>2026-07-30 16:30</span>
        </div>
        <div className="flex justify-between">
          <span>Format Layout:</span>
          <span>{paperSize}</span>
        </div>
      </div>
      <p className="text-[8px] text-slate-400 text-center font-sans">Visual invoice format template preview</p>
    </div>
  );
};
