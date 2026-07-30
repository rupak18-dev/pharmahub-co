import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Plus } from 'lucide-react';
import { INITIAL_TRANSFERS } from '../../constants/branchData';
import { TransferTable } from '../../components/branches/TransferTable';

export default function TransferHistory() {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState(INITIAL_TRANSFERS);

  const handleStatusUpdate = (id, newStatus) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus, approvedBy: 'Counter Staff (Received)' } : t))
    );
    alert(`Transfer ${id} received & local stock inventory balanced!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Inter-Branch Stock Transfers</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Relocate drug inventories across outlets, monitor in-transit status, and verify physical delivery counts
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard/transfers/new')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Relocation</span>
        </button>
      </div>

      <TransferTable transfers={transfers} onStatusUpdate={handleStatusUpdate} />
    </div>
  );
}
