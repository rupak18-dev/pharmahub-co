import React from 'react';
import { motion } from 'framer-motion';

export const SupplierCard = ({ title, value, subtext, icon: Icon, color = 'blue' }) => {
  const colorStyles = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="saas-card rounded-2xl p-4 flex items-center justify-between"
    >
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
          {value}
        </h3>
        {subtext && (
          <p className="text-[10px] text-slate-400 mt-1 font-medium">{subtext}</p>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl border ${colorStyles[color] || colorStyles.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </motion.div>
  );
};
