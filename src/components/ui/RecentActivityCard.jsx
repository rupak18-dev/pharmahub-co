import React from 'react';
import { motion } from 'framer-motion';

export const RecentActivityCard = ({ activities = [] }) => {
  return (
    <div className="space-y-3">
      {activities.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.id || idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-slate-400 block">
                {item.timestamp}
              </span>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {item.badge}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
