import React from 'react';
import { Receipt, Printer } from 'lucide-react';
import { GST_TAX_SUMMARY } from '../../constants/reportsData';

export default function GstReports() {
  const gst = GST_TAX_SUMMARY;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>GST Tax Return & HSN Summary</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            GSTR-1, GSTR-3B tax liability, ITC credit input, and HSN code classification
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Printer className="w-4 h-4" />
          <span>Print GST Summary</span>
        </button>
      </div>

      {/* Tax Liability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Output GST Collected (Sales)</span>
          <h3 className="text-2xl font-extrabold text-blue-600">₹{gst.collectedGst.toFixed(2)}</h3>
        </div>

        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Input Tax Credit (Purchases)</span>
          <h3 className="text-2xl font-extrabold text-emerald-500">₹{gst.paidGst.toFixed(2)}</h3>
        </div>

        <div className="saas-card rounded-2xl p-4 space-y-1 border-blue-500/30">
          <span className="text-[10px] font-bold text-blue-600 uppercase font-sans">Net GST Tax Payable</span>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">₹{gst.netTaxLiability.toFixed(2)}</h3>
        </div>
      </div>

      {/* HSN Summary Table */}
      <div className="saas-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">HSN Code Wise Tax Breakdown</h3>
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px] font-sans">
            <tr>
              <th className="py-2.5 px-3">HSN Code</th>
              <th className="py-2.5 px-3 font-sans">Description</th>
              <th className="py-2.5 px-3">Taxable Value</th>
              <th className="py-2.5 px-3">GST Rate</th>
              <th className="py-2.5 px-3 text-right">GST Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {gst.hsnSummary.map((hsn) => (
              <tr key={hsn.hsnCode}>
                <td className="py-2.5 px-3 font-bold text-blue-600">{hsn.hsnCode}</td>
                <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300">{hsn.description}</td>
                <td className="py-2.5 px-3">₹{hsn.taxable.toFixed(2)}</td>
                <td className="py-2.5 px-3 font-bold">{hsn.gstRate}</td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">₹{hsn.gstAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
