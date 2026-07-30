import React, { useState } from 'react';
import { SlidersHorizontal, Download, Save, Check } from 'lucide-react';

export default function ReportBuilder() {
  const [selectedColumns, setSelectedColumns] = useState(['Invoice #', 'Date', 'Customer', 'Grand Total', 'Payment Mode']);
  const [dateRange, setDateRange] = useState('This Month');
  const [filterModule, setFilterModule] = useState('Sales Register');

  const availableColumns = [
    'Invoice #',
    'Date',
    'Customer',
    'Cashier',
    'Subtotal',
    'Discount',
    'GST Amount',
    'Grand Total',
    'Payment Mode',
    'Medicine Name',
    'Batch Number',
    'Rack Location',
  ];

  const toggleColumn = (col) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Custom Ad-Hoc Report Builder</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Select custom data fields, date range windows, and export reporting templates
        </p>
      </div>

      <div className="saas-card rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-500 mb-1">Select Data Source Module *</label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
            >
              <option value="Sales Register">POS Sales Register</option>
              <option value="Inward Procurement">Inward Procurement Purchases</option>
              <option value="Stock Master">Stock Master Valuation</option>
              <option value="GST Audit">GST Tax Audit</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Select Date Window *</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month (July 2026)</option>
              <option value="Last Quarter">Last Quarter</option>
              <option value="Full Year YTD">Full Year YTD</option>
            </select>
          </div>
        </div>

        {/* Column Selection Checkboxes */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-900 dark:text-white">Choose Table Columns to Display:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {availableColumns.map((col) => {
              const isChecked = selectedColumns.includes(col);
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggleColumn(col)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                    isChecked
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span>{col}</span>
                  {isChecked && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between gap-2">
          <button
            type="button"
            onClick={() => alert('Saved report template as "Custom Monthly Sales Summary"')}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Report Template</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Generate & Export Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
