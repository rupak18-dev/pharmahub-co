import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { CATEGORIES, MANUFACTURERS } from '../../constants/inventoryData';

export const FilterBar = ({
  selectedCategory,
  setSelectedCategory,
  selectedManufacturer,
  setSelectedManufacturer,
  selectedStatus,
  setSelectedStatus,
  selectedRack,
  setSelectedRack,
  onReset,
}) => {
  const racks = ['All Racks', 'Rack A', 'Rack B', 'Rack C', 'Rack D', 'Counter Rack'];
  const statuses = ['All Statuses', 'In Stock', 'Low Stock', 'Out of Stock', 'Expiring Soon'];

  return (
    <div className="saas-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
          <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Advanced Inventory Filters</span>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Category Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Manufacturer Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Manufacturer
          </label>
          <select
            value={selectedManufacturer}
            onChange={(e) => setSelectedManufacturer(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Manufacturers</option>
            {MANUFACTURERS.map((mfg) => (
              <option key={mfg.name} value={mfg.name}>
                {mfg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Stock Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Rack Location Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Rack Location
          </label>
          <select
            value={selectedRack}
            onChange={(e) => setSelectedRack(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            {racks.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
