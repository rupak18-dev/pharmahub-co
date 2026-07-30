import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserCard = ({ user }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="saas-card rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all cursor-pointer"
      onClick={() => navigate(`/dashboard/users/${user.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
          />
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
              {user.name}
            </h4>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{user.id}</span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
          {user.role}
        </span>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
        <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">{user.email}</span>
        </p>
        <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
          <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>{user.phone}</span>
        </p>
        <p className="text-slate-400">
          Branch: <span className="text-slate-700 dark:text-slate-300 font-bold">{user.branch}</span>
        </p>
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-400">
        <span>Dept: {user.department}</span>
        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-sans font-bold">
          {user.status}
        </span>
      </div>
    </motion.div>
  );
};
