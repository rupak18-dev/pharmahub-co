import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users } from 'lucide-react';

export const DepartmentCard = ({ dept }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="saas-card rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-slate-800"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">{dept.name}</h4>
          <span className="text-[10px] font-mono text-slate-400">{dept.code}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 font-mono">
        <Users className="w-3.5 h-3.5 text-blue-600" />
        <span>{dept.userCount} member(s)</span>
      </div>
    </motion.div>
  );
};
