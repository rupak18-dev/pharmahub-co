import React, { useState } from 'react';
import { Building2, Plus, Star, Phone, Globe } from 'lucide-react';
import { MANUFACTURERS } from '../../constants/inventoryData';

export default function Manufacturers() {
  const [manufacturers, setManufacturers] = useState(MANUFACTURERS);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Pharma Manufacturers & Companies</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registered pharmaceutical companies and distributors ({manufacturers.length} active)
          </p>
        </div>

        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20">
          <Plus className="w-4 h-4" />
          <span>Add Manufacturer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {manufacturers.map((mfg) => (
          <div key={mfg.name} className="saas-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">
                {mfg.code}
              </span>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span>{mfg.rating}</span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{mfg.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Origin: {mfg.country}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>{mfg.contact}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
