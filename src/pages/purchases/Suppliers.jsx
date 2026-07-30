import React, { useState } from 'react';
import { Building2, Plus, Search } from 'lucide-react';
import { INITIAL_SUPPLIERS } from '../../constants/purchaseData';
import { SupplierTable } from '../../components/purchases/SupplierTable';
import { SearchBar } from '../../components/inventory/SearchBar';
import { ConfirmationDialog } from '../../components/inventory/ConfirmationDialog';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
  const [search, setSearch] = useState('');
  const [deletingSup, setDeletingSup] = useState(null);

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.gstin.toLowerCase().includes(search.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirm = () => {
    if (deletingSup) {
      setSuppliers((prev) => prev.filter((s) => s.id !== deletingSup.id));
      setDeletingSup(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Pharma Suppliers & Distributors</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Authorized pharmaceutical distributors, GSTIN compliance, and credit ledger ({suppliers.length} active)
          </p>
        </div>

        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20">
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search supplier by company name, GSTIN, or contact person..." />

      <SupplierTable
        suppliers={filtered}
        onEdit={(sup) => alert(`Edit supplier modal for ${sup.name}`)}
        onDelete={(sup) => setDeletingSup(sup)}
      />

      <ConfirmationDialog
        isOpen={!!deletingSup}
        onClose={() => setDeletingSup(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Supplier Record?"
        message={`Are you sure you want to delete supplier "${deletingSup?.name}"?`}
        confirmText="Delete Supplier"
      />
    </div>
  );
}
