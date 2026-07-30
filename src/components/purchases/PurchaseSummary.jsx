import React from 'react';

export const PurchaseSummary = ({
  subtotal = 0,
  discount = 0,
  gst = 0,
  transportCharges = 0,
  otherCharges = 0,
  setTransportCharges,
  setOtherCharges,
}) => {
  const taxable = subtotal - discount;
  const rawTotal = taxable + gst + Number(transportCharges || 0) + Number(otherCharges || 0);
  const grandTotal = Math.round(rawTotal);
  const roundOff = grandTotal - rawTotal;

  return (
    <div className="saas-card rounded-2xl p-4 space-y-2.5 font-medium text-xs">
      <div className="flex justify-between text-slate-500 dark:text-slate-400">
        <span>Subtotal:</span>
        <span className="font-mono text-slate-900 dark:text-white font-bold">
          ₹{subtotal.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between text-slate-500 dark:text-slate-400">
        <span>Trade Discount:</span>
        <span className="font-mono text-rose-500 font-bold">
          -₹{discount.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between text-slate-500 dark:text-slate-400">
        <span>GST Amount (Inward Credit):</span>
        <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
          +₹{gst.toFixed(2)}
        </span>
      </div>

      {setTransportCharges && (
        <div className="flex items-center justify-between text-slate-500">
          <span>Freight / Transport:</span>
          <input
            type="number"
            value={transportCharges}
            onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
            className="w-20 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 text-right font-mono text-xs text-slate-900 dark:text-white"
          />
        </div>
      )}

      {setOtherCharges && (
        <div className="flex items-center justify-between text-slate-500">
          <span>Packaging & Misc Charges:</span>
          <input
            type="number"
            value={otherCharges}
            onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
            className="w-20 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 text-right font-mono text-xs text-slate-900 dark:text-white"
          />
        </div>
      )}

      <div className="flex justify-between text-slate-500 dark:text-slate-400">
        <span>Round Off:</span>
        <span className="font-mono text-slate-500 font-bold">
          {roundOff >= 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}
        </span>
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline text-sm">
        <span className="font-extrabold text-slate-900 dark:text-white">Grand Total Payable:</span>
        <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-lg">
          ₹{grandTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
