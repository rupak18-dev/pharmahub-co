import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const SettingsCard = ({ title, description, icon: Icon, path }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="saas-card rounded-2xl p-5 flex items-start gap-4 hover:border-blue-500/40 transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
      onClick={() => navigate(path)}
    >
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
          {title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-sans">
          {description}
        </p>
      </div>
    </motion.div>
  );
};
