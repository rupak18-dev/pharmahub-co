import React, { useState } from 'react';
import { Search, Plus, Pill, AlertCircle } from 'lucide-react';
import { INITIAL_MEDICINES } from '../../constants/inventoryData';

export const ProductSearch = ({ onSelectMedicine }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = INITIAL_MEDICINES.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.genericName.toLowerCase().includes(query.toLowerCase()) ||
      m.batchNumber.toLowerCase().includes(query.toLowerCase()) ||
      m.sku.toLowerCase().includes(query.toLowerCase()) ||
      m.barcode.includes(query)
  );

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search drug by brand name, generic formula, SKU, or batch... (F2)"
          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-12 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
          F2
        </kbd>
      </div>

      {/* Auto-Suggest Results Dropdown */}
      {isOpen && query.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 saas-card rounded-2xl p-2 z-50 max-h-80 overflow-y-auto shadow-2xl space-y-1 border border-slate-200 dark:border-slate-800">
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching medicines found in catalog.
            </div>
          ) : (
            results.map((med) => {
              const isOut = med.currentStock === 0;
              return (
                <div
                  key={med.id}
                  onClick={() => {
                    if (!isOut) {
                      onSelectMedicine(med);
                      setQuery('');
                      setIsOpen(false);
                    }
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isOut
                      ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800/80 hover:border-blue-500 hover:bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {med.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {med.genericName} • <span className="font-mono text-blue-600 dark:text-blue-400">Batch: {med.batchNumber}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block">
                      ₹{med.sellingPrice.toFixed(2)}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        isOut ? 'text-rose-500' : med.currentStock <= med.minimumStock ? 'text-amber-500' : 'text-emerald-500'
                      }`}
                    >
                      {isOut ? 'Out of Stock' : `${med.currentStock} in stock`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
