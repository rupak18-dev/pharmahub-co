import React, { useState } from 'react';
import { Wrench, Check, History, ArrowRightLeft } from 'lucide-react';
import { INITIAL_MEDICINES } from '../../constants/inventoryData';

export default function StockAdjustment() {
  const [selectedMedId, setSelectedMedId] = useState(INITIAL_MEDICINES[0].id);
  const [adjustmentType, setAdjustmentType] = useState('Increase Stock');
  const [quantity, setQuantity] = useState(10);
  const [reason, setReason] = useState('Physical Audit Variance');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState([
    {
      id: 1,
      medicineName: 'Amoxicillin 500mg',
      type: 'Increase Stock',
      quantity: 10,
      reason: 'Physical Audit Variance',
      adjustedBy: 'Head Pharmacist',
      timestamp: '2026-07-28 14:30',
    },
    {
      id: 2,
      medicineName: 'Dolo 650mg Tablet',
      type: 'Damage Stock',
      quantity: -5,
      reason: 'Broken Packaging on Shelf B',
      adjustedBy: 'Branch Manager',
      timestamp: '2026-07-25 11:15',
    },
  ]);

  const adjustmentTypes = [
    'Increase Stock',
    'Decrease Stock',
    'Damage Stock',
    'Lost Stock',
    'Return Stock',
    'Transfer Stock',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const med = INITIAL_MEDICINES.find((m) => m.id === selectedMedId);
    const newLog = {
      id: Date.now(),
      medicineName: med ? med.name : 'Selected Medicine',
      type: adjustmentType,
      quantity: adjustmentType.includes('Increase') ? Number(quantity) : -Number(quantity),
      reason,
      adjustedBy: 'Logged-in User',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setHistory((prev) => [newLog, ...prev]);
    setNotes('');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Stock Adjustment & Quarantine</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Record manual stock additions, damage write-offs, lost inventory, and rack transfers
        </p>
      </div>

      {/* Adjustment Form */}
      <div className="saas-card rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
          New Adjustment Transaction
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Select Medicine *
              </label>
              <select
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
              >
                {INITIAL_MEDICINES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.batchNumber}) - Stock: {m.currentStock}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Adjustment Action Type *
              </label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
              >
                {adjustmentTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Adjustment Quantity *
              </label>
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
              <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Reason *
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Broken packaging, physical count discrepancy"
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Audit Notes
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional comments or supervisor verification details..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Check className="w-4 h-4" />
              <span>Record Stock Adjustment</span>
            </button>
          </div>
        </form>
      </div>

      {/* History Audit Log */}
      <div className="saas-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          <span>Recent Stock Adjustment Audit Log</span>
        </h3>

        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase">
            <tr>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Medicine</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Qty Change</th>
              <th className="py-2.5 px-3">Reason</th>
              <th className="py-2.5 px-3">Adjusted By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {history.map((log) => (
              <tr key={log.id}>
                <td className="py-2.5 px-3 text-slate-400">{log.timestamp}</td>
                <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">{log.medicineName}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold">
                    {log.type}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-bold">
                  <span className={log.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                    {log.quantity > 0 ? `+${log.quantity}` : log.quantity} units
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-400 font-sans">{log.reason}</td>
                <td className="py-2.5 px-3 text-slate-400 font-sans">{log.adjustedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
