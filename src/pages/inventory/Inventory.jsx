import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Pill,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  CalendarOff,
  Wrench,
  Warehouse,
  QrCode,
  Layers,
  Building2,
  Plus
} from 'lucide-react';
import { INITIAL_MEDICINES } from '../../constants/inventoryData';
import { InventoryCard } from '../../components/inventory/InventoryCard';
import { MedicineTable } from '../../components/inventory/MedicineTable';
import { MedicineForm } from '../../components/inventory/MedicineForm';
import { ConfirmationDialog } from '../../components/inventory/ConfirmationDialog';

export default function Inventory() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [deletingMed, setDeletingMed] = useState(null);

  // Metric Computations
  const totalMedicines = medicines.length;
  const totalStockValue = medicines.reduce((acc, m) => acc + m.purchasePrice * m.currentStock, 0);
  const outOfStock = medicines.filter((m) => m.currentStock === 0).length;
  const lowStock = medicines.filter((m) => m.currentStock > 0 && m.currentStock <= m.minimumStock).length;
  const expiringSoon = medicines.filter((m) => m.status === 'Expiring Soon').length;
  const damagedStock = 14; // Placeholder
  const warehouseStock = medicines.reduce((acc, m) => acc + m.currentStock, 0);

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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="saas-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-500/5 to-emerald-500/10 border-blue-500/20">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Medicine & Inventory Master Hub</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized pharmaceutical warehouse management, stock levels, and batch compliance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingMed(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Medicine</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (7 Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InventoryCard
          title="Total Medicines"
          value={totalMedicines}
          subtext="Catalog SKUs active"
          icon={Pill}
          color="blue"
        />
        <InventoryCard
          title="Total Stock Value"
          value={`₹${(totalStockValue / 100000).toFixed(2)}L`}
          subtext="At purchase cost price"
          icon={DollarSign}
          color="emerald"
        />
        <InventoryCard
          title="Out of Stock"
          value={outOfStock}
          subtext="Immediate reorder needed"
          icon={AlertCircle}
          color="rose"
        />
        <InventoryCard
          title="Low Stock"
          value={lowStock}
          subtext="Below threshold"
          icon={AlertTriangle}
          color="amber"
        />
        <InventoryCard
          title="Expiring Soon"
          value={expiringSoon}
          subtext="Within 60 days"
          icon={CalendarOff}
          color="rose"
        />
        <InventoryCard
          title="Damaged / Quarantined"
          value={`${damagedStock} units`}
          subtext="Pending disposal"
          icon={Wrench}
          color="purple"
        />
        <InventoryCard
          title="Warehouse Total"
          value={`${warehouseStock} units`}
          subtext="Across all racks"
          icon={Warehouse}
          color="blue"
        />
      </div>

      {/* Sub-module Navigation Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { name: 'Medicines Catalog', path: '/dashboard/inventory/medicines', icon: Pill },
          { name: 'Categories', path: '/dashboard/inventory/categories', icon: Layers },
          { name: 'Manufacturers', path: '/dashboard/inventory/manufacturers', icon: Building2 },
          { name: 'Batches', path: '/dashboard/inventory/batches', icon: Package },
          { name: 'Expiry Intelligence', path: '/dashboard/inventory/expiry', icon: CalendarOff },
          { name: 'Low Stock Watch', path: '/dashboard/inventory/low-stock', icon: AlertTriangle },
          { name: 'Barcode & Labels', path: '/dashboard/inventory/barcodes', icon: QrCode },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="saas-card rounded-2xl p-3 text-center flex flex-col items-center justify-center gap-2 hover:border-blue-500/40 group transition-all"
            >
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Recent Medicine Master Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Inventory Master Table</h3>
          <button
            onClick={() => navigate('/dashboard/inventory/medicines')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Full Catalog ➔
          </button>
        </div>

        <MedicineTable
          medicines={medicines}
          onEdit={(med) => {
            setEditingMed(med);
            setIsFormOpen(true);
          }}
          onDelete={(med) => setDeletingMed(med)}
        />
      </div>

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
        message={`Are you sure you want to delete "${deletingMed?.name}" from your catalog? This cannot be undone.`}
        confirmText="Delete Record"
      />
    </div>
  );
}
