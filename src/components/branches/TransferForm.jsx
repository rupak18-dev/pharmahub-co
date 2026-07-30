import React, { useState } from 'react';
import { Send, Check } from 'lucide-react';
import { INITIAL_BRANCHES, INITIAL_WAREHOUSES } from '../../constants/branchData';
import { INITIAL_MEDICINES } from '../../constants/inventoryData';

export const TransferForm = ({ onSubmit, onCancel }) => {
  const [fromBranch, setFromBranch] = useState(INITIAL_WAREHOUSES[0].name);
  const [toBranch, setToBranch] = useState(INITIAL_BRANCHES[0].name);
  const [medicine, setMedicine] = useState(INITIAL_MEDICINES[0].name);
  const [batch, setBatch] = useState(INITIAL_MEDICINES[0].batchNumber);
  const [quantity, setQuantity] = useState(100);
  const [transferDate, setTransferDate] = useState('2026-07-30');
  const [reason, setReason] = useState('Stock Replenishment');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      fromBranch,
      toBranch,
      medicine,
      batch,
      quantity,
      transferDate,
      reason,
      medicineCount: 1,
      status: 'In Transit',
      approvedBy: 'Logged-in User',
    });
  };

  const destinations = [...INITIAL_BRANCHES.map((b) => b.name), ...INITIAL_WAREHOUSES.map((w) => w.name)];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-slate-500 mb-1">From Source Location *</label>
          <select
            value={fromBranch}
            onChange={(e) => setFromBranch(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
          >
            {destinations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-500 mb-1">To Destination Outlet *</label>
          <select
            value={toBranch}
            onChange={(e) => setToBranch(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
          >
            {destinations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block font-semibold text-slate-500 mb-1">Select Medicine *</label>
          <select
            value={medicine}
            onChange={(e) => {
              setMedicine(e.target.value);
              const matched = INITIAL_MEDICINES.find((m) => m.name === e.target.value);
              if (matched) setBatch(matched.batchNumber);
            }}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
          >
            {INITIAL_MEDICINES.map((m) => (
              <option key={m.id} value={m.name}>{m.name} ({m.genericName})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-500 mb-1">Batch Code Reference *</label>
          <input
            type="text"
            required
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-slate-500 mb-1">Transfer Quantity *</label>
          <input
            type="number"
            required
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-500 mb-1">Transfer Date</label>
          <input
            type="date"
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
          />
        </div>
      </div>

      <div>
        <label className="block font-semibold text-slate-500 mb-1">Reason / Reference Remarks *</label>
        <input
          type="text"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Urgent stock depletion, regular replenishment"
          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
        />
      </div>

      <div className="pt-2 flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
        >
          <Check className="w-4 h-4" />
          <span>Dispatch Stock Transfer</span>
        </button>
      </div>
    </form>
  );
};
