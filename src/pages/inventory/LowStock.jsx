import React from 'react';
import { AlertTriangle, ShoppingCart, Truck } from 'lucide-react';
import { INITIAL_MEDICINES } from '../../constants/inventoryData';

export default function LowStock() {
  const lowStockItems = INITIAL_MEDICINES.filter((m) => m.currentStock <= m.minimumStock);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <span>Low Stock Watchlist</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Medicines requiring immediate stock replenishment ({lowStockItems.length} items flagged)
          </p>
        </div>
      </div>

      {/* Low Stock Table */}
      <div className="saas-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Medicine</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">Min. Threshold</th>
                <th className="py-3.5 px-4">Primary Supplier</th>
                <th className="py-3.5 px-4">Last Purchase Date</th>
                <th className="py-3.5 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {lowStockItems.map((med) => (
                <tr key={med.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {med.name}
                    <span className="text-[10px] text-slate-400 font-mono block">{med.manufacturer}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-500">
                    {med.currentStock} units
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{med.minimumStock} units</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {med.manufacturer} Distributors
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">2026-06-15</td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 ml-auto shadow-md shadow-blue-600/20">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Create Purchase Order</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
