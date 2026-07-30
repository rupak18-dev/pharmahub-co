import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Phone, Mail, MapPin, ShieldCheck, DollarSign, FileText, Package } from 'lucide-react';
import { INITIAL_SUPPLIERS, PURCHASE_ORDERS } from '../../constants/purchaseData';

export default function SupplierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'history' | 'medicines' | 'notes'

  const supplier = INITIAL_SUPPLIERS.find((s) => s.id === id) || INITIAL_SUPPLIERS[0];
  const supplierOrders = PURCHASE_ORDERS.filter((po) => po.supplierName === supplier.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/purchases/suppliers')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Suppliers</span>
        </button>
      </div>

      {/* Supplier Profile Header Card */}
      <div className="saas-card rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{supplier.name}</h1>
              <p className="text-xs text-slate-400 font-mono">GSTIN: {supplier.gstin} • License: {supplier.licenseNo}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>{supplier.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>{supplier.email}</span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{supplier.address}</span>
            </div>
          </div>
        </div>

        {/* Outstanding Ledger Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Outstanding Balance</span>
          <h3 className="text-2xl font-extrabold font-mono text-amber-500">₹{supplier.outstandingAmount.toFixed(2)}</h3>
          <p className="text-xs text-slate-500 font-medium">Payment Terms: <strong>{supplier.paymentTerms}</strong></p>
          <button className="w-full mt-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all">
            Record Vendor Payment
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'orders', label: 'Recent Orders', icon: FileText },
          { id: 'medicines', label: 'Supplied Medicines', icon: Package },
          { id: 'notes', label: 'Vendor Notes', icon: ShieldCheck },
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
        {activeTab === 'orders' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Purchase Orders</h3>
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">PO Number</th>
                  <th className="py-2.5 px-3">Invoice Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {supplierOrders.map((po) => (
                  <tr key={po.poNumber}>
                    <td className="py-2.5 px-3 font-bold text-blue-600">{po.poNumber}</td>
                    <td className="py-2.5 px-3 text-slate-900 dark:text-white">{po.invoiceNumber}</td>
                    <td className="py-2.5 px-3 text-slate-400">{po.purchaseDate}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">₹{po.total.toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'medicines' && (
          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-900 dark:text-white">Medicines Sourced from Supplier:</p>
            <p className="text-slate-500">Amoxicillin 500mg, Pan 40mg Tablet, Dolo 650mg Tablet.</p>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="text-xs text-slate-500">
            <p>Direct authorized distributor for Sun Pharma. Reliable 2-day delivery lead time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
