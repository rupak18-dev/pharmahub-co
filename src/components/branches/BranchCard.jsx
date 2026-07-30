import React from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, IndianRupee, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BranchCard = ({ branch }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="saas-card rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all cursor-pointer"
      onClick={() => navigate(`/dashboard/branches/${branch.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
              {branch.name}
            </h4>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{branch.code}</span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          {branch.status}
        </span>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span className="truncate">{branch.address}</span>
        </p>
        <p className="text-xs text-slate-400 font-medium">
          Manager: <span className="text-slate-700 dark:text-slate-300 font-bold">{branch.manager}</span>
        </p>
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-sans block">Today's Sales</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            ₹{branch.todaysSales.toLocaleString()}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-sans block">Stock Value</span>
          <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
            ₹{branch.currentStockValue.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
