import React from 'react';
import { Database, Download, Upload } from 'lucide-react';
import { SectionHeader } from '../../components/settings/SectionHeader';

export default function BackupRestore() {
  const handleBackup = () => {
    alert('Generating database snapshot... Backup download started (pharmahub_backup_20260730.json).');
  };

  const handleRestore = () => {
    alert('Restore simulation initialized. Please select a valid JSON backup snapshot.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionHeader
        title="Database Backup & System Restore"
        subtitle="Download complete local ERP records or restore data settings snapshots"
        icon={Database}
      />

      <div className="saas-card rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Export Local ERP Database Snapshot</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Creates a downloadable JSON snapshot file mapping all SKU directories, customer databases, sales invoices, and supplier ledgers.
            </p>
          </div>
          <button
            onClick={handleBackup}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow shadow-blue-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Generate Backup Snapshot</span>
          </button>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Restore System Database</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed font-sans">
              Upload a valid database snapshot file to restore records. Warning: this overrides existing local state parameters.
            </p>
          </div>
          <button
            onClick={handleRestore}
            className="w-full flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Restore Backup Snapshot</span>
          </button>
        </div>
      </div>
    </div>
  );
}
