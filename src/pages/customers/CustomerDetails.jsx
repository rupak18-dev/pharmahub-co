import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Award, Wallet, FileText, History, Stethoscope } from 'lucide-react';
import { INITIAL_CUSTOMERS, PRESCRIPTIONS, WALLET_TRANSACTIONS } from '../../constants/customerData';

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('prescriptions'); // 'prescriptions' | 'wallet' | 'loyalty' | 'timeline'

  const customer = INITIAL_CUSTOMERS.find((c) => c.id === id) || INITIAL_CUSTOMERS[0];
  const patientRx = PRESCRIPTIONS.filter((rx) => rx.customerName === customer.name || rx.customerId === customer.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/customers')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </button>
      </div>

      {/* Customer Profile Header */}
      <div className="saas-card rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-xl border border-blue-500/20">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{customer.name}</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  {customer.membershipTier}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                ID: {customer.id} • Gender: {customer.gender} • Age: {customer.age} yrs • Blood Group: <strong className="text-rose-500">{customer.bloodGroup}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Primary Doctor: <strong>{customer.doctorName}</strong></span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{customer.address}</span>
            </div>
          </div>
        </div>

        {/* Financial & Loyalty Overview Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Prepaid Wallet Balance:</span>
            <span className="font-bold text-emerald-500 text-sm">₹{customer.walletBalance.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Loyalty Points:</span>
            <span className="font-bold text-amber-500 text-sm">{customer.loyaltyPoints} pts</span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Outstanding Balance:</span>
            <span className={`font-bold text-sm ${customer.outstandingAmount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
              ₹{customer.outstandingAmount.toFixed(2)}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
            <p>Medical Remarks: <em className="text-slate-700 dark:text-slate-300">{customer.remarks}</em></p>
          </div>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
          { id: 'wallet', label: 'Wallet History', icon: Wallet },
          { id: 'loyalty', label: 'Loyalty Rewards', icon: Award },
          { id: 'timeline', label: 'Activity Timeline', icon: History },
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

      {/* Tab Contents */}
      <div className="saas-card rounded-2xl p-5">
        {activeTab === 'prescriptions' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Prescriptions</h3>
            {patientRx.map((rx) => (
              <div key={rx.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between font-mono font-bold">
                  <span className="text-blue-600">{rx.id} • {rx.doctorName}</span>
                  <span className="text-slate-400">{rx.date}</span>
                </div>
                <div className="space-y-1 pt-1">
                  {rx.medicines.map((m, idx) => (
                    <div key={idx} className="flex justify-between font-medium">
                      <span>{m.name} ({m.dosage})</span>
                      <span className="text-slate-500">{m.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="space-y-2 text-xs font-mono">
            <p className="font-bold text-slate-900 dark:text-white font-sans">Recent Wallet Transactions:</p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border flex justify-between">
              <span>Top-up via UPI QR (2026-07-28)</span>
              <span className="text-emerald-500 font-bold">+₹1,000.00</span>
            </div>
          </div>
        )}

        {activeTab === 'loyalty' && (
          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-900 dark:text-white">Loyalty Membership Level: {customer.membershipTier}</p>
            <p className="text-slate-500">Accumulated 450 points across 12 pharmacy orders.</p>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-2 text-xs font-mono">
            <p className="text-slate-400">[2026-07-30 10:45 AM] Purchased invoice INV-9021 (₹208.00)</p>
            <p className="text-slate-400">[2026-07-28 09:30 AM] Uploaded new prescription RX-88412</p>
          </div>
        )}
      </div>
    </div>
  );
}
