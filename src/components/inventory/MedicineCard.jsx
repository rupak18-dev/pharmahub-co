import React from 'react';
import { Eye, Edit, Trash2, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MedicineCard = ({ medicine, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const isLow = medicine.currentStock <= medicine.minimumStock;
  const isOut = medicine.currentStock === 0;

  return (
    <div className="saas-card rounded-2xl p-4 flex flex-col justify-between space-y-3 group">
      <div>
        <div className="flex items-start gap-3">
          <img
            src={medicine.image}
            alt={medicine.name}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <button
              onClick={() => navigate(`/dashboard/inventory/medicines/${medicine.id}`)}
              className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left block truncate"
            >
              {medicine.name}
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {medicine.genericName}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {medicine.category}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Rack: {medicine.rack}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-400 text-[10px] block">Selling Price</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
            ₹{medicine.sellingPrice.toFixed(2)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-slate-400 text-[10px] block">Current Stock</span>
          <span className={`font-mono font-bold ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
            {medicine.currentStock} units
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isOut
              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              : isLow
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          }`}
        >
          {medicine.status}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/dashboard/inventory/medicines/${medicine.id}`)}
            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(medicine)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            title="Edit"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(medicine)}
            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
