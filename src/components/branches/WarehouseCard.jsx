import React from 'react';
import { motion } from 'framer-motion';
import { Warehouse, User, Database, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WarehouseCard = ({ warehouse }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="saas-card rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all cursor-pointer"
      onClick={() => navigate(`/dashboard/warehouses/${warehouse.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm shrink-0 border border-purple-500/20">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
              {warehouse.name}
            </h4>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{warehouse.code}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar of capacity */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-bold text-slate-400">
          <span>Capacity Utilization</span>
          <span>{warehouse.capacity}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${warehouse.capacity}%` }}
          ></div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-sans block">Manager</span>
          <span className="font-sans font-bold text-slate-700 dark:text-slate-300">
            {warehouse.manager.split(' ')[0]}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-sans block">Total Inventory</span>
          <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
            {warehouse.currentStock.toLocaleString()} units
          </span>
        </div>
      </div>
    </motion.div>
  );
};
