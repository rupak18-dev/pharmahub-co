import React, { useState } from 'react';
import { Package, Award, ShieldAlert, Map } from 'lucide-react';
import { CONSOLIDATED_STOCK } from '../../constants/branchData';

export default function CentralInventory() {
  const [stocks, setStocks] = useState(CONSOLIDATED_STOCK);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Map className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Consolidated Central Multi-Branch Inventory Map</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time consolidation of stock balances for every drug SKU mapped across all pharmacy outlets and bulk storage facilities
        </p>
      </div>

      <div className="saas-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px] font-sans">
            <tr>
              <th className="py-3 px-4">Medicine Item</th>
              <th className="py-3 px-4">Generic Formula</th>
              <th className="py-3 px-4">Therapeutic Category</th>
              <th className="py-3 px-4">Branch Outlet Stock breakdown Map</th>
              <th className="py-3 px-4 text-right">Consolidated Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {stocks.map((item) => {
              const totalStock = item.branches.reduce((acc, b) => acc + b.stock, 0);

              return (
                <tr key={item.medicineId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">{item.name}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-500">{item.genericName}</td>
                  <td className="py-3.5 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-600">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-sans text-[11px]">
                    <div className="space-y-1">
                      {item.branches.map((b) => (
                        <div key={b.name} className="flex justify-between max-w-xs gap-3">
                          <span className="text-slate-400">{b.name.split(' ')[0]}:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{b.stock} units</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {totalStock.toLocaleString()} units
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
