import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Warehouse, User, Database, LayoutGrid } from 'lucide-react';
import { INITIAL_WAREHOUSES } from '../../constants/branchData';

export default function WarehouseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('zones'); // 'zones' | 'racks'

  const warehouse = INITIAL_WAREHOUSES.find((w) => w.id === id) || INITIAL_WAREHOUSES[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/warehouses')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Warehouses</span>
        </button>
      </div>

      {/* Warehouse Profile Summary Header */}
      <div className="saas-card rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg border border-purple-500/20">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{warehouse.name}</h1>
              <p className="text-xs text-slate-400 font-mono">Warehouse Code: {warehouse.code}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              <span>Manager: {warehouse.manager}</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Total Capacity: {warehouse.currentStock.toLocaleString()} units available</span>
            </div>
          </div>
        </div>

        {/* Capacity utilization indicator */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-center">
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>Capacity Utilization</span>
            <span className="font-mono text-purple-600">{warehouse.capacity}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5">
            <div
              className="bg-purple-600 h-2.5 rounded-full transition-all"
              style={{ width: `${warehouse.capacity}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'zones', label: 'Layout Zones', icon: LayoutGrid },
          { id: 'racks', label: 'Racks & Shelves Map', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="saas-card rounded-2xl p-5">
        {activeTab === 'zones' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Warehouse Zones</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouse.zones.map((zone) => (
                <div key={zone.code} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between font-mono font-bold">
                    <span className="text-purple-600">{zone.name}</span>
                    <span className="text-slate-400">{zone.capacity}% Capacity</span>
                  </div>
                  <p className="text-slate-500 font-bold font-mono">Stock: {zone.itemsCount.toLocaleString()} units</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'racks' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Racks & Shelves Blueprint Layout</h3>
            <p className="text-xs text-slate-500">Rack Cold-01, Rack Gen-A1, Rack Gen-A2, Rack Quarant-01.</p>
          </div>
        )}
      </div>
    </div>
  );
}
