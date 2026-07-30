import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, Receipt, CheckCircle } from 'lucide-react';
import { INITIAL_INVOICES } from '../../constants/salesData';

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const invoice = INITIAL_INVOICES.find((i) => i.id === id) || INITIAL_INVOICES[0];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/billing/history')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sales History</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print GST Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoice Document Box */}
      <div className="saas-card rounded-2xl p-8 space-y-6 font-mono text-xs">
        <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-extrabold text-xl text-slate-900 dark:text-white">
            Pharma<span className="text-blue-600">Hub</span> Central Pharmacy
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            GSTIN: 27AABCU9603R • Drug License #: DL-MH-20B-88910 / 21B-88911
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-sans">Tax Invoice Number</span>
            <p className="font-bold text-sm text-blue-600">{invoice.id}</p>
            <p className="text-[11px] text-slate-500 font-sans mt-1">Date: {invoice.date}</p>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[10px] uppercase font-sans">Patient & Doctor Info</span>
            <p className="font-bold text-slate-900 dark:text-white font-sans">{invoice.customerName}</p>
            <p className="text-slate-500 font-sans">Doctor: {invoice.doctorName}</p>
          </div>
        </div>

        {/* Item Table */}
        <table className="w-full text-left text-xs border-b border-slate-200 dark:border-slate-800">
          <thead className="text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2">Item Description</th>
              <th className="py-2">Batch</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">GST %</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {invoice.items.map((it, idx) => (
              <tr key={idx}>
                <td className="py-2 font-sans font-bold text-slate-900 dark:text-white">{it.name}</td>
                <td className="py-2 font-bold text-blue-600">{it.batch}</td>
                <td className="py-2 text-center">{it.qty}</td>
                <td className="py-2 text-right">₹{it.price.toFixed(2)}</td>
                <td className="py-2 text-right">{it.gst}%</td>
                <td className="py-2 text-right font-bold">₹{it.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Breakdown */}
        <div className="flex justify-end pt-2">
          <div className="w-64 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-rose-500">
              <span>Discount:</span>
              <span>-₹{invoice.discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Est. GST (12%):</span>
              <span>+₹{invoice.gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-bold text-base text-slate-900 dark:text-white">
              <span>Grand Total:</span>
              <span className="text-blue-600">₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
