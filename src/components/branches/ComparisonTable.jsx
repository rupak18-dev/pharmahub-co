import React from 'react';

export const ComparisonTable = ({ data = [] }) => {
  return (
    <div className="saas-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px] font-sans">
            <tr>
              <th className="py-3.5 px-4">Performance KPI / Dimension</th>
              {data.map((b) => (
                <th key={b.name} className="py-3.5 px-4 text-center">{b.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">Monthly Sales Revenue</td>
              {data.map((b) => (
                <td key={b.name} className="py-3 px-4 text-center text-blue-600 font-bold">₹{b.sales.toLocaleString()}</td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">Procurement Purchases</td>
              {data.map((b) => (
                <td key={b.name} className="py-3 px-4 text-center text-rose-500 font-bold">₹{b.purchases.toLocaleString()}</td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">Net Gross Profit</td>
              {data.map((b) => (
                <td key={b.name} className="py-3 px-4 text-center text-emerald-500 font-bold">₹{b.profit.toLocaleString()}</td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">Current Inventory Value</td>
              {data.map((b) => (
                <td key={b.name} className="py-3 px-4 text-center text-purple-500 font-bold">₹{b.inventoryValue.toLocaleString()}</td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">Active Patient Customer Base</td>
              {data.map((b) => (
                <td key={b.name} className="py-3 px-4 text-center text-slate-800 dark:text-slate-200">{b.customerCount} patients</td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white font-sans">Top Selling Medicine Category</td>
              {data.map((b) => (
                <td key={b.name} className="py-3 px-4 text-center text-slate-600 dark:text-slate-400 font-sans font-semibold">{b.topCategory}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
