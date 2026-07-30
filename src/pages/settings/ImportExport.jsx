import React from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { SectionHeader } from '../../components/settings/SectionHeader';

export default function ImportExport() {
  const handleImport = (moduleName) => {
    alert(`Import wizard simulation started for module: "${moduleName}". Please select an Excel or CSV file.`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionHeader
        title="Spreadsheet Import & Export Master"
        subtitle="Bulk import medicine SKU catalogs, patient CRM registries, and supplier logs using templates"
        icon={FileSpreadsheet}
      />

      <div className="saas-card rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select Data Target Module</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
          {['Medicine SKU Catalog', 'Patient CRM Directory', 'Supplier Procurement Log'].map((mod) => (
            <div key={mod} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <span className="font-bold text-slate-700 dark:text-slate-300">{mod}</span>
              <button
                onClick={() => handleImport(mod)}
                className="w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Excel/CSV</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
