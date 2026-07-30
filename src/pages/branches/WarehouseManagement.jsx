import React, { useState } from 'react';
import { Warehouse, Plus } from 'lucide-react';
import { INITIAL_WAREHOUSES } from '../../constants/branchData';
import { WarehouseCard } from '../../components/branches/WarehouseCard';
import { WarehouseTable } from '../../components/branches/WarehouseTable';
import { SearchBar } from '../../components/inventory/SearchBar';
import { ConfirmationDialog } from '../../components/inventory/ConfirmationDialog';

export default function WarehouseManagement() {
  const [warehouses, setWarehouses] = useState(INITIAL_WAREHOUSES);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [deletingWh, setDeletingWh] = useState(null);

  const filtered = warehouses.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.code.toLowerCase().includes(search.toLowerCase()) ||
    w.manager.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirm = () => {
    if (deletingWh) {
      setWarehouses((prev) => prev.filter((w) => w.id !== deletingWh.id));
      setDeletingWh(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Pharma Warehouses & Storage Facilities</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of central bulk storage facility capacity, layout zones, and inventory balances ({warehouses.length} registered)
          </p>
        </div>

        <button
          onClick={() => alert('Add warehouse modal/page placeholder.')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Warehouse</span>
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search warehouse by name, code, or manager..." />

      {/* Grid or Table render */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((w) => (
            <WarehouseCard key={w.id} warehouse={w} />
          ))}
        </div>
      ) : (
        <WarehouseTable
          warehouses={filtered}
          onEdit={(w) => alert(`Edit warehouse details for ${w.name}`)}
          onDelete={(w) => setDeletingWh(w)}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deletingWh}
        onClose={() => setDeletingWh(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Warehouse Record?"
        message={`Are you sure you want to delete warehouse "${deletingWh?.name}" from multi-tenant register?`}
        confirmText="Confirm Delete"
      />
    </div>
  );
}
