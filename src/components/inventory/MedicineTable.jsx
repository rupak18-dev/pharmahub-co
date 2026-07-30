import React from 'react';
import { Eye, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MedicineTable = ({ medicines = [], onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div className="saas-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-900/90 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="py-3.5 px-3">Item</th>
              <th className="py-3.5 px-3">Medicine Details</th>
              <th className="py-3.5 px-3">Category / Mfg</th>
              <th className="py-3.5 px-3">Batch & HSN</th>
              <th className="py-3.5 px-3">Pricing (Cost / Sell / MRP)</th>
              <th className="py-3.5 px-3">Stock / Min</th>
              <th className="py-3.5 px-3">Expiry & Rack</th>
              <th className="py-3.5 px-3">Status</th>
              <th className="py-3.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
            {medicines.map((med) => {
              const isLow = med.currentStock <= med.minimumStock;
              const isOut = med.currentStock === 0;

              return (
                <tr key={med.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  {/* Image */}
                  <td className="py-3 px-3">
                    <img
                      src={med.image}
                      alt={med.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                    />
                  </td>

                  {/* Medicine & Generic Name */}
                  <td className="py-3 px-3">
                    <button
                      onClick={() => navigate(`/dashboard/inventory/medicines/${med.id}`)}
                      className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left block text-xs"
                    >
                      {med.name}
                    </button>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-[160px]">
                      {med.genericName}
                    </span>
                  </td>

                  {/* Category & Manufacturer */}
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{med.category}</span>
                    <span className="text-[10px] text-slate-400 block">{med.manufacturer}</span>
                  </td>

                  {/* Batch & HSN & GST */}
                  <td className="py-3 px-3 font-mono text-[11px]">
                    <span className="text-slate-900 dark:text-slate-200 font-bold block">{med.batchNumber}</span>
                    <span className="text-slate-400 text-[10px] block">HSN: {med.hsnCode} • GST: {med.gstRate}%</span>
                  </td>

                  {/* Pricing */}
                  <td className="py-3 px-3 font-mono">
                    <div className="font-bold text-slate-900 dark:text-white">₹{med.sellingPrice.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400">Cost: ₹{med.purchasePrice.toFixed(2)} • MRP: ₹{med.mrp.toFixed(2)}</div>
                  </td>

                  {/* Stock */}
                  <td className="py-3 px-3 font-mono">
                    <span className={`font-bold text-xs ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {med.currentStock} units
                    </span>
                    <span className="text-[10px] text-slate-400 block">Min: {med.minimumStock}</span>
                  </td>

                  {/* Expiry & Rack */}
                  <td className="py-3 px-3">
                    <span className="font-mono text-slate-700 dark:text-slate-300 block">{med.expiryDate}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">{med.rack} / {med.shelf}</span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isOut
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : isLow
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}
                    >
                      {med.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/dashboard/inventory/medicines/${med.id}`)}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(med)}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                        title="Edit Medicine"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(med)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
                        title="Delete Medicine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
