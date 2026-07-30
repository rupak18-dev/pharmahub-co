import React, { useState } from 'react';
import { Package, Plus, Search } from 'lucide-react';
import { BATCHES } from '../../constants/inventoryData';
import { BatchCard } from '../../components/inventory/BatchCard';

export default function Batches() {
  const [batches, setBatches] = useState(BATCHES);
  const [search, setSearch] = useState('');

  const filtered = batches.filter((b) =>
    b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.medicineName.toLowerCase().includes(search.toLowerCase()) ||
    b.supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Batch Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track individual manufacturing batches, pricing variations, and supplier origins
          </p>
        </div>

        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20">
          <Plus className="w-4 h-4" />
          <span>New Batch Entry</span>
        </button>
      </div>

      {/* Grid of Batches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((b) => (
          <BatchCard key={b.batchNumber} batch={b} />
        ))}
      </div>
    </div>
  );
}
