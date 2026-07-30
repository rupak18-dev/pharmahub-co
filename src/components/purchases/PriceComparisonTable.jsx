import React from 'react';
import { Star, CheckCircle, Award } from 'lucide-react';

export const PriceComparisonTable = ({ comparison }) => {
  return (
    <div className="saas-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Supplier Price Matrix: {comparison.medicineName}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Side-by-side wholesale rate comparison across authorized pharma distributors
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px]">
            <tr>
              <th className="py-3 px-4 font-sans">Supplier Name</th>
              <th className="py-3 px-4">Purchase Price</th>
              <th className="py-3 px-4">GST %</th>
              <th className="py-3 px-4">Discount</th>
              <th className="py-3 px-4">Effective Net Price</th>
              <th className="py-3 px-4 font-sans">Delivery Lead Time</th>
              <th className="py-3 px-4">Supplier Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {comparison.suppliers.map((sup, idx) => {
              const netPrice = sup.purchasePrice * (1 - sup.discount / 100) * (1 + sup.gst / 100);
              const isBest = idx === 0;

              return (
                <tr key={sup.name} className={isBest ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : ''}>
                  <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {sup.name}
                    {isBest && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Lowest Net Cost
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    ₹{sup.purchasePrice.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{sup.gst}%</td>
                  <td className="py-3.5 px-4 text-rose-500 font-bold">-{sup.discount}%</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400 text-sm">
                    ₹{netPrice.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-300">
                    {sup.leadTime}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="flex items-center gap-1 font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      {sup.rating}
                    </span>
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
