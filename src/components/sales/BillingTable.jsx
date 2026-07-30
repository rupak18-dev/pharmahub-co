import React from 'react';
import { Trash2, ShoppingBag } from 'lucide-react';
import { QuantityEditor } from './QuantityEditor';
import { DiscountInput } from './DiscountInput';

export const BillingTable = ({ items = [], onUpdateQty, onUpdateDiscount, onRemoveItem }) => {
  if (items.length === 0) {
    return (
      <div className="saas-card rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Billing Cart is Empty</h4>
        <p className="text-xs text-slate-500 max-w-xs">
          Search drugs above or scan a barcode to add medicines to this transaction bill.
        </p>
      </div>
    );
  }

  return (
    <div className="saas-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-3">Medicine Item</th>
              <th className="py-3 px-3">Batch</th>
              <th className="py-3 px-3 text-center">Qty</th>
              <th className="py-3 px-3 text-right">Unit Price</th>
              <th className="py-3 px-3 text-center">Discount</th>
              <th className="py-3 px-3 text-center">GST %</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3 text-center">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
            {items.map((item) => {
              const lineSubtotal = item.sellingPrice * item.qty;
              const lineDiscount = (lineSubtotal * (item.discount || 0)) / 100;
              const lineTaxable = lineSubtotal - lineDiscount;
              const lineGst = (lineTaxable * (item.gstRate || 12)) / 100;
              const lineTotal = lineTaxable + lineGst;

              return (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 dark:text-white block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">{item.genericName}</span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {item.batchNumber}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <QuantityEditor
                      value={item.qty}
                      onChange={(newQty) => onUpdateQty(item.id, newQty)}
                      max={item.currentStock}
                    />
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ₹{item.sellingPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <DiscountInput
                      value={item.discount || 0}
                      onChange={(newDisc) => onUpdateDiscount(item.id, newDisc)}
                    />
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                    {item.gstRate || 12}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                    ₹{lineTotal.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
                      title="Remove Row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
