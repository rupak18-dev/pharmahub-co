import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Phone, MapPin, DollarSign, Package, Users, Activity } from 'lucide-react';
import { INITIAL_BRANCHES } from '../../constants/branchData';
import { INITIAL_MEDICINES } from '../../constants/inventoryData';

export default function BranchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'employees' | 'sales' | 'activities'

  const branch = INITIAL_BRANCHES.find((b) => b.id === id) || INITIAL_BRANCHES[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/branches')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Branches</span>
        </button>
      </div>

      {/* Branch Profile Summary Header */}
      <div className="saas-card rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{branch.name}</h1>
              <p className="text-xs text-slate-400 font-mono">Branch Code: {branch.code}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>{branch.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{branch.address}</span>
            </div>
          </div>
        </div>

        {/* Local metrics summary */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Current Stock Value</span>
          <h3 className="text-2xl font-extrabold font-mono text-blue-600">₹{branch.currentStockValue.toLocaleString()}</h3>
          <p className="text-xs text-slate-500 font-medium">Local Manager: <strong>{branch.manager}</strong></p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'inventory', label: 'Local Stock', icon: Package },
          { id: 'employees', label: 'Employees Directory', icon: Users },
          { id: 'sales', label: 'Local Revenue Summary', icon: DollarSign },
          { id: 'activities', label: 'Recent Event Log', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
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

      {/* Tab Content */}
      <div className="saas-card rounded-2xl p-5">
        {activeTab === 'inventory' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active SKU Inventories</h3>
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Medicine Description</th>
                  <th className="py-2.5 px-3">Batch Number</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                  <th className="py-2.5 px-3 text-right">Available Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {INITIAL_MEDICINES.map((med) => (
                  <tr key={med.id}>
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">{med.name}</td>
                    <td className="py-2.5 px-3 font-bold text-blue-600">{med.batchNumber}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">{med.category}</td>
                    <td className="py-2.5 px-3 text-right">₹{med.sellingPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {Math.floor(med.currentStock / 3)} units
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Staff Directory</h3>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border flex justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{branch.manager}</p>
                <p className="text-slate-500">Local Counter Supervisor</p>
              </div>
              <span className="font-mono text-slate-400 font-semibold">Active Session</span>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Today's Local Point-Of-Sale Revenue</h3>
            <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Tendered Gross Total</span>
              <span className="font-mono font-extrabold text-emerald-500 text-lg">₹{branch.todaysSales.toLocaleString()}</span>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-2 text-xs font-mono text-slate-500">
            <p className="text-slate-400">[2026-07-30 11:30 AM] Staff shift logged in by {branch.manager.split(' ')[0]}.</p>
            <p className="text-slate-400">[2026-07-30 09:15 AM] Inward stock transfer received (+150 units Amoxicillin).</p>
          </div>
        )}
      </div>
    </div>
  );
}
