import React, { useState } from 'react';
import { Users, Plus, Search, Wallet, Award, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { INITIAL_CUSTOMERS, REFILL_REMINDERS } from '../../constants/customerData';
import { CustomerTable } from '../../components/customers/CustomerTable';
import { SearchBar } from '../../components/inventory/SearchBar';
import { ConfirmationDialog } from '../../components/inventory/ConfirmationDialog';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [deletingCustomer, setDeletingCustomer] = useState(null);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalWallet = customers.reduce((acc, c) => acc + c.walletBalance, 0);
  const creditCustomersCount = customers.filter((c) => c.outstandingAmount > 0).length;

  const handleDeleteConfirm = () => {
    if (deletingCustomer) {
      setCustomers((prev) => prev.filter((c) => c.id !== deletingCustomer.id));
      setDeletingCustomer(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Customer & Patient CRM</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage patient records, loyalty rewards, prepaid wallets, and prescription refills ({customers.length} active)
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard/customers/new')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="saas-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Patients</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{customers.length}</h3>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">100% Verified Profiles</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="saas-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Credit Accounts</span>
            <h3 className="text-2xl font-extrabold text-amber-500 mt-0.5">{creditCustomersCount}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Active ledger accounts</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="saas-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Prepaid Wallet Pool</span>
            <h3 className="text-2xl font-extrabold text-emerald-500 mt-0.5">₹{totalWallet.toFixed(2)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Pre-funded customer balances</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="saas-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Upcoming Refills</span>
            <h3 className="text-2xl font-extrabold text-purple-500 mt-0.5">{REFILL_REMINDERS.length}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Chronic medication alerts</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search patient by full name, phone number, or email..." />

      <CustomerTable
        customers={filtered}
        onEdit={(c) => alert(`Edit profile modal for ${c.name}`)}
        onDelete={(c) => setDeletingCustomer(c)}
      />

      <ConfirmationDialog
        isOpen={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Patient Record?"
        message={`Are you sure you want to delete patient record for "${deletingCustomer?.name}"?`}
        confirmText="Delete Record"
      />
    </div>
  );
}
