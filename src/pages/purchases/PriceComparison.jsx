import React, { useState } from 'react';
import { Award, Search } from 'lucide-react';
import { PRICE_COMPARISONS } from '../../constants/purchaseData';
import { PriceComparisonTable } from '../../components/purchases/PriceComparisonTable';

export default function PriceComparison() {
  const [selectedMedIndex, setSelectedMedIndex] = useState(0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Multi-Supplier Price Matrix Comparison</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Compare wholesale purchase rates, trade discounts, GST liabilities, and lead times across distributors
        </p>
      </div>

      {/* Select Medicine Selector */}
      <div className="saas-card rounded-2xl p-4 flex items-center gap-4">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
          Select Medicine for Comparison:
        </label>
        <select
          value={selectedMedIndex}
          onChange={(e) => setSelectedMedIndex(Number(e.target.value))}
          className="w-full max-w-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
        >
          {PRICE_COMPARISONS.map((comp, idx) => (
            <option key={comp.medicineName} value={idx}>
              {comp.medicineName} ({comp.suppliers.length} Suppliers)
            </option>
          ))}
        </select>
      </div>

      {/* Comparison Matrix Table */}
      <PriceComparisonTable comparison={PRICE_COMPARISONS[selectedMedIndex]} />
    </div>
  );
}
