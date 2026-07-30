import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Copy, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RoleCard = ({ role, onClone, onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="saas-card rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all cursor-pointer"
      onClick={() => navigate(`/dashboard/roles/${role.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
              {role.name}
            </h4>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{role.id}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
        {role.description}
      </p>

      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-1.5 font-sans">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {role.userCount} Active Users
          </span>
        </div>

        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()} // Prevent card navigation trigger
        >
          <button
            onClick={() => onClone && onClone(role)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            title="Clone Role"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit && onEdit(role)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            title="Edit Permissions"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete && onDelete(role)}
            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
            title="Delete Role"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
