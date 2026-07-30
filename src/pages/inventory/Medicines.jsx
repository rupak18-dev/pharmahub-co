import React, { useState } from 'react';
import { Pill, Plus, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { INITIAL_MEDICINES } from '../../constants/inventoryData';
import { SearchBar } from '../../components/inventory/SearchBar';
import { FilterBar } from '../../components/inventory/FilterBar';
import { MedicineTable } from '../../components/inventory/MedicineTable';
import { MedicineCard } from '../../components/inventory/MedicineCard';
import { Pagination } from '../../components/inventory/Pagination';
import { MedicineForm } from '../../components/inventory/MedicineForm';
import { ConfirmationDialog } from '../../components/inventory/ConfirmationDialog';

export default function Medicines() {
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedManufacturer, setSelectedManufacturer] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedRack, setSelectedRack] = useState('All Racks');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [deletingMed, setDeletingMed] = useState(null);

  // Filter Logic
  const filtered = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()) ||
      m.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      m.barcode.includes(search);

    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesMfg = selectedManufacturer === 'All' || m.manufacturer === selectedManufacturer;
    const matchesStatus = selectedStatus === 'All Statuses' || m.status === selectedStatus;
    const matchesRack = selectedRack === 'All Racks' || m.rack === selectedRack;

    return matchesSearch && matchesCat && matchesMfg && matchesStatus && matchesRack;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedMedicines = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedManufacturer('All');
    setSelectedStatus('All Statuses');
    setSelectedRack('All Racks');
  };

  const handleSaveMedicine = (medData) => {
    if (editingMed) {
      setMedicines((prev) => prev.map((m) => (m.id === medData.id ? medData : m)));
    } else {
      const newMed = {
        ...medData,
        id: `MED-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      setMedicines((prev) => [newMed, ...prev]);
    }
    setEditingMed(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingMed) {
      setMedicines((prev) => prev.filter((m) => m.id !== deletingMed.id));
      setDeletingMed(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Pill className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Medicines Catalog</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage pharmaceutical formulas, SKUs, pricing, and stock status ({medicines.length} total)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingMed(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <SearchBar value={search} onChange={setSearch} />
        <FilterBar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedManufacturer={selectedManufacturer}
          setSelectedManufacturer={setSelectedManufacturer}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedRack={selectedRack}
          setSelectedRack={setSelectedRack}
          onReset={handleResetFilters}
        />
      </div>

      {/* Main Content (Table or Grid) */}
      {viewMode === 'table' ? (
        <MedicineTable
          medicines={paginatedMedicines}
          onEdit={(med) => {
            setEditingMed(med);
            setIsFormOpen(true);
          }}
          onDelete={(med) => setDeletingMed(med)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedMedicines.map((med) => (
            <MedicineCard
              key={med.id}
              medicine={med}
              onEdit={(m) => {
                setEditingMed(m);
                setIsFormOpen(true);
              }}
              onDelete={(m) => setDeletingMed(m)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={filtered.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Form Drawer / Modal */}
      <MedicineForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMed(null);
        }}
        onSubmit={handleSaveMedicine}
        initialData={editingMed}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingMed}
        onClose={() => setDeletingMed(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Medicine Master Record?"
        message={`Are you sure you want to delete "${deletingMed?.name}" from your catalog?`}
        confirmText="Delete Record"
      />
    </div>
  );
}
