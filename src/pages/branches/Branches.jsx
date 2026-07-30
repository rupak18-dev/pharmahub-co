import React, { useState } from 'react';
import { Building2, Plus, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { INITIAL_BRANCHES } from '../../constants/branchData';
import { BranchCard } from '../../components/branches/BranchCard';
import { BranchTable } from '../../components/branches/BranchTable';
import { SearchBar } from '../../components/inventory/SearchBar';
import { ConfirmationDialog } from '../../components/inventory/ConfirmationDialog';

export default function Branches() {
  const [branches, setBranches] = useState(INITIAL_BRANCHES);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [deletingBranch, setDeletingBranch] = useState(null);

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase()) ||
    b.manager.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirm = () => {
    if (deletingBranch) {
      setBranches((prev) => prev.filter((b) => b.id !== deletingBranch.id));
      setDeletingBranch(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Multi-Branch Counter Directories</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of pharmacy outlets, code designations, local counter managers, and sales value ({branches.length} registered)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggler */}
          <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => alert('Add branch modal/page placeholder.')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Outlet</span>
          </button>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search retail branch by outlet name, code, or manager..." />

      {/* Grid or Table render */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <BranchCard key={b.id} branch={b} />
          ))}
        </div>
      ) : (
        <BranchTable
          branches={filtered}
          onEdit={(b) => alert(`Edit branch details for ${b.name}`)}
          onDelete={(b) => setDeletingBranch(b)}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deletingBranch}
        onClose={() => setDeletingBranch(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Outlet Record?"
        message={`Are you sure you want to delete branch "${deletingBranch?.name}" from multi-tenant register?`}
        confirmText="Confirm Delete"
      />
    </div>
  );
}
