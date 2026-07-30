import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pill,
  Package,
  Calendar,
  Building2,
  QrCode,
  History,
  ShoppingCart,
  Truck,
  Printer,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { INITIAL_MEDICINES, BATCHES } from '../../constants/inventoryData';

export default function MedicineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' | 'suppliers' | 'purchases' | 'sales' | 'timeline'

  const medicine = INITIAL_MEDICINES.find((m) => m.id === id) || INITIAL_MEDICINES[0];

  const medicineBatches = BATCHES.filter((b) => b.medicineId === medicine.id || b.medicineName === medicine.name);

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/inventory/medicines')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Medicines Catalog</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Master Card</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="saas-card rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex items-start gap-4 lg:col-span-2">
          <img
            src={medicine.image}
            alt={medicine.name}
            className="w-24 h-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{medicine.name}</h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {medicine.category}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Generic: <strong className="text-slate-700 dark:text-slate-200">{medicine.genericName}</strong>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mfg: <strong>{medicine.manufacturer}</strong> • Pack: <strong>{medicine.packSize}</strong> • HSN: <strong>{medicine.hsnCode}</strong>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
              {medicine.description}
            </p>
          </div>
        </div>

        {/* Stock & Barcode Widget */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Rack / Shelf Location:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{medicine.rack} / {medicine.shelf}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Current Stock:</span>
            <span className="font-bold text-base text-blue-600 dark:text-blue-400">{medicine.currentStock} units</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Selling Price:</span>
            <span className="font-bold text-slate-900 dark:text-white">₹{medicine.sellingPrice.toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400">Barcode: {medicine.barcode}</span>
            <QrCode className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Detail Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'batches', label: 'Batch List', icon: Package },
          { id: 'suppliers', label: 'Supplier History', icon: Building2 },
          { id: 'purchases', label: 'Purchase History', icon: Truck },
          { id: 'sales', label: 'Sales History', icon: ShoppingCart },
          { id: 'timeline', label: 'Inventory Timeline', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="saas-card rounded-2xl p-5">
        {activeTab === 'batches' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active & Past Batches</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-3">Batch Number</th>
                  <th className="py-2.5 px-3">Mfg Date</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3">Cost / Selling</th>
                  <th className="py-2.5 px-3">Available Qty</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {medicineBatches.map((b) => (
                  <tr key={b.batchNumber}>
                    <td className="py-2.5 px-3 font-bold text-blue-600">{b.batchNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{b.mfdDate}</td>
                    <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">{b.expiryDate}</td>
                    <td className="py-2.5 px-3">₹{b.purchasePrice} / ₹{b.sellingPrice}</td>
                    <td className="py-2.5 px-3 font-bold">{b.quantity} units</td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans">{b.supplier}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Authorized Suppliers & Distributors</h3>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Sun Pharma Distributors Pvt Ltd</p>
                <p className="text-slate-500">Authorized primary supplier • GSTIN: 27AABCS9901R1Z</p>
              </div>
              <span className="text-blue-600 font-bold font-mono">Lead Time: 2 days</span>
            </div>
          </div>
        )}

        {activeTab === 'purchases' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Inward Purchase Invoices</h3>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white font-mono">PO #9042 • Invoice #INV-8812</p>
                <p className="text-slate-500">Received 500 units on 2026-07-15</p>
              </div>
              <span className="font-bold font-mono text-emerald-500">Total: ₹32,500.00</span>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">POS Sales Volume</h3>
            <p className="text-xs text-slate-500">84 units sold across 32 transactions in last 30 days.</p>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Audit & Movement Timeline</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">[2026-07-28 14:30]</span> Stock adjusted (+10 units) by Head Pharmacist.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">[2026-07-15 10:15]</span> Inward shipment PO #9042 received (+500 units).
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
