import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  variant = 'blue',
  subtext,
}) => {
  // Premium Design System Presets matching the attached mockup
  const cardPresets = {
    sage: {
      card: 'bg-[#dce3c7] text-[#1a2d1d] border-none rounded-[28px]',
      title: 'text-[#2b4530]',
      value: 'text-[#1a2d1d]',
      subtext: 'text-[#2b4530]/80',
      badge: 'bg-[#1a2d1d] text-[#dce3c7]',
      iconBg: 'bg-[#1a2d1d]/10 text-[#1a2d1d] border-[#1a2d1d]/20',
    },
    lavender: {
      card: 'bg-[#e0e4f7] text-[#1c233c] border-none rounded-[28px]',
      title: 'text-[#313c5f]',
      value: 'text-[#1c233c]',
      subtext: 'text-[#313c5f]/80',
      badge: 'bg-[#1c233c] text-[#e0e4f7]',
      iconBg: 'bg-[#1c233c]/10 text-[#1c233c] border-[#1c233c]/20',
    },
    white: {
      card: 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 rounded-[28px]',
      title: 'text-slate-500 dark:text-slate-400',
      value: 'text-slate-900 dark:text-white',
      subtext: 'text-slate-500 dark:text-slate-400',
      badge: 'bg-[#155e39] text-[#eefbf4]',
      iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    },
    peach: {
      card: 'bg-[#fbeee8] text-[#4a2c1f] border-none rounded-[28px]',
      title: 'text-[#6c4839]',
      value: 'text-[#4a2c1f]',
      subtext: 'text-[#6c4839]/80',
      badge: 'bg-[#4a2c1f] text-[#fbeee8]',
      iconBg: 'bg-[#4a2c1f]/10 text-[#4a2c1f] border-[#4a2c1f]/20',
    },
    // Fallbacks
    blue: {
      card: 'saas-card rounded-[24px]',
      title: 'text-slate-500 dark:text-slate-400',
      value: 'text-slate-900 dark:text-white',
      subtext: 'text-slate-500 dark:text-slate-400',
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
  };

  const current = cardPresets[variant] || cardPresets.blue;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 shadow-sm border relative overflow-hidden transition-all duration-300 ${current.card}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${current.title}`}>
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border transition-colors ${current.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className={`text-2xl font-extrabold tracking-tight ${current.value}`}>
          {value}
        </h3>
        {change && (
          <span
            className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              current.badge || (isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20')
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {subtext && (
        <p className={`text-[10px] mt-3 font-semibold ${current.subtext}`}>
          {subtext}
        </p>
      )}
    </motion.div>
  );
};
