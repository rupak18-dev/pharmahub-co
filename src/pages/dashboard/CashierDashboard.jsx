import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function CashierDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2">Cashier Dashboard</h1>
        <p className="text-sm text-slate-400">
          Welcome back, <strong className="text-emerald-400">{user?.name}</strong>. Role: <span className="font-mono text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">{user?.role}</span>
        </p>
      </div>
    </div>
  );
}
