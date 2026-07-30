import React, { useState } from 'react';
import { RotateCcw, Check } from 'lucide-react';
import { PURCHASE_RETURNS, PURCHASE_ORDERS } from '../../constants/purchaseData';

export default function PurchaseReturns() {
  const [returns, setReturns] = useState(PURCHASE_RETURNS);
  const [selectedPo, setSelectedPo] = useState(PURCHASE_ORDERS[0].poNumber);
  const [reason, setReason] = useState('Damaged Packaging on Delivery');
  const [returnQty, setReturnQty] = useState(10);

  const handleProcessReturn = (e) => {
    e.preventDefault();
    const po = PURCHASE_ORDERS.find((p) => p.poNumber === selectedPo);
    const newReturn = {
      returnId: `PRET-${Math.floor(900 + Math.random() * 900)}`,
      poNumber: selectedPo,
      supplierName: po ? po.supplierName : 'Vendor Supplier',
      date: new Date().toISOString().substring(0, 10),
      returnQty: Number(returnQty),
      refundAmount: Number(returnQty) * 65.0,
      reason,
      status: 'Credit Note Received',
    };
    setReturns((prev) => [newReturn, ...prev]);
    alert(`Purchase Return ${newReturn.returnId} processed! Supplier debit note created.`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-rose-500" />
          <span>Purchase Returns & Debit Notes</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Process damaged goods returns to suppliers and claim vendor credit notes
        </p>
      </div>

      <div className="saas-card rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
          Initiate Vendor Return
        </h3>

        <form onSubmit={handleProcessReturn} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Select Purchase Order (PO) *
              </label>
              <select
                value={selectedPo}
                onChange={(e) => setSelectedPo(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white"
              >
                {PURCHASE_ORDERS.map((po) => (
                  <option key={po.poNumber} value={po.poNumber}>
                    {po.poNumber} - {po.supplierName} (₹{po.total})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Return Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
              >
                <option value="Damaged Packaging on Delivery">Damaged Packaging on Delivery</option>
                <option value="Short Supply Variance">Short Supply Variance</option>
                <option value="Near Expiry Batch Received">Near Expiry Batch Received</option>
                <option value="Wrong Formula Dispatched">Wrong Formula Dispatched</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Return Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                value={returnQty}
                onChange={(e) => setReturnQty(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20"
            >
              <Check className="w-4 h-4" />
              <span>Record Purchase Return & Issue Debit Note</span>
            </button>
          </div>
        </form>
      </div>

      <div className="saas-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Vendor Return Audit Log</h3>
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Return ID</th>
              <th className="py-2.5 px-3">PO Reference</th>
              <th className="py-2.5 px-3 font-sans">Supplier Name</th>
              <th className="py-2.5 px-3">Return Qty</th>
              <th className="py-2.5 px-3">Credit Claim</th>
              <th className="py-2.5 px-3 font-sans">Reason</th>
              <th className="py-2.5 px-3 font-sans">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {returns.map((ret) => (
              <tr key={ret.returnId}>
                <td className="py-2.5 px-3 font-bold text-rose-500">{ret.returnId}</td>
                <td className="py-2.5 px-3 text-blue-600 font-bold">{ret.poNumber}</td>
                <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">{ret.supplierName}</td>
                <td className="py-2.5 px-3 font-bold">{ret.returnQty} units</td>
                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">₹{ret.refundAmount.toFixed(2)}</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">{ret.reason}</td>
                <td className="py-2.5 px-3 font-sans">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">
                    {ret.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
