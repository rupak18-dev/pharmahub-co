import React from 'react';

export const InvoiceSummary = ({
  subtotal = 0,
  discountAmount = 0,
  gstAmount = 0,
  roundOff = 0,
  grandTotal = 0,
  paidAmount = 0,
  setPaidAmount,
}) => {
  const balance = Math.max(0, paidAmount - grandTotal);
  const due = Math.max(0, grandTotal - paidAmount);

  return (
    <div className="saas-card rounded-2xl p-4 space-y-2.5 font-medium text-xs">
      <div className="flex justify-between text-slate-500 dark:text-slate-400">
        <span>Subtotal:</span>
        <span className="font-mono text-slate-900 dark:text-white font-bold">
          ₹{subtotal.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between text-slate-500 dark:text-slate-400">
        <span>Total Discount:</span>
        <span className="font-mono text-rose-500 font-bold">
          -₹{discountAmount.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between text-slate-500 dark:text-slate-400">
        <span>Est. GST (12%):</span>
        <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
          +₹{gstAmount.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between text-slate-500 dark:text-slate-400">
        <span>Round Off:</span>
        <span className="font-mono text-slate-500 font-bold">
          {roundOff >= 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}
        </span>
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline text-sm">
        <span className="font-extrabold text-slate-900 dark:text-white">Grand Total:</span>
        <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-lg">
          ₹{grandTotal.toFixed(2)}
        </span>
      </div>

      {setPaidAmount && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Tendered / Paid:</span>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              className="w-24 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1 text-right font-mono font-bold text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono">
            {due > 0 ? (
              <span className="text-amber-500 font-bold">Remaining Due: ₹{due.toFixed(2)}</span>
            ) : (
              <span className="text-emerald-500 font-bold">Change Return: ₹{balance.toFixed(2)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
