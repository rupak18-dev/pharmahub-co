import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import { TransferForm } from '../../components/branches/TransferForm';

export default function StockTransfer() {
  const navigate = useNavigate();

  const handleTransferSubmit = (transferData) => {
    alert(`Stock relocation dispatch recorded from "${transferData.fromBranch}" to "${transferData.toBranch}"!`);
    navigate('/dashboard/transfers');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/transfers')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Transfer History</span>
        </button>
      </div>

      <div className="saas-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>New Stock Relocation Requisition</span>
        </h2>

        <TransferForm onSubmit={handleTransferSubmit} onCancel={() => navigate('/dashboard/transfers')} />
      </div>
    </div>
  );
}
