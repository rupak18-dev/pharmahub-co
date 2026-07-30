import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { ComparisonTable } from '../../components/branches/ComparisonTable';

export default function BranchComparison() {
  const comparisonData = [
    {
      name: 'Kothrud Central',
      sales: 452000,
      purchases: 280000,
      profit: 172000,
      inventoryValue: 850000,
      customerCount: 450,
      topCategory: 'Antibiotics',
    },
    {
      name: 'Viman Nagar',
      sales: 284000,
      purchases: 185000,
      profit: 99000,
      inventoryValue: 560000,
      customerCount: 280,
      topCategory: 'Analgesics',
    },
    {
      name: 'Aundh Specialty',
      sales: 312000,
      purchases: 210000,
      profit: 102000,
      inventoryValue: 420000,
      customerCount: 310,
      topCategory: 'Cardiovascular',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Multi-Branch Side-By-Side Performance Comparison</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Benchmark revenue margins, purchase costs, inventory value, and patient counts across retail outlets
        </p>
      </div>

      <ComparisonTable data={comparisonData} />
    </div>
  );
}
