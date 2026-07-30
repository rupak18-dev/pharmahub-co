import React from 'react';
import { BarChart3, Printer } from 'lucide-react';
import { INITIAL_MEDICINES } from '../../constants/inventoryData';

export default function InventoryReports() {
  const totalValue = INITIAL_MEDICINES.reduce((acc, m) => acc + m.sellingPrice * m.currentStock, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            <span>Stock Inventory Valuation Report</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total pharmacy stock valuation: <strong className="text-purple-500 font-mono">₹{totalValue.toLocaleString()}</strong>
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Printer className="w-4 h-4" />
          <span>Print Inventory Valuation</span>
        </button>
      </div>

      <div className="saas-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px] font-sans">
            <tr>
              <th className="py-3.5 px-4 font-sans">Medicine Name</th>
              <th className="py-3.5 px-4">Available Stock</th>
              <th className="py-3.5 px-4 text-right">Selling Price</th>
              <th className="py-3.5 px-4 text-right">Inventory Value</th>
              <th className="py-3.5 px-4">Batch #</th>
              <th className="py-3.5 px-4">Expiry Date</th>
              <th className="py-3.5 px-4 font-sans">Rack / Warehouse</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {INITIAL_MEDICINES.map((m) => {
              const val = m.sellingPrice * m.currentStock;
              return (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                    {m.name}
                    <span className="text-[10px] text-slate-400 font-mono block">{m.category}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{m.currentStock} units</td>
                  <td className="py-3.5 px-4 text-right">₹{m.sellingPrice.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-purple-500">₹{val.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">{m.batchNumber}</td>
                  <td className="py-3.5 px-4 text-slate-400">{m.expiryDate}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-500">Rack {m.rack} (Central WH)</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
