import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { SectionHeader } from '../../components/settings/SectionHeader';
import { SettingsForm } from '../../components/settings/SettingsForm';
import { INITIAL_NUMBER_SERIES } from '../../constants/settingsData';

export default function NumberSeries() {
  const [series, setSeries] = useState(INITIAL_NUMBER_SERIES);

  const handleSave = (e) => {
    e.preventDefault();
    alert('Document prefix sequencing series rules applied.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionHeader
        title="Document Number Sequencing Series"
        subtitle="Manage auto-generation formatting sequences for invoices, POs, and GRNs"
        icon={Lock}
      />

      <div className="saas-card rounded-2xl p-6">
        <SettingsForm onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div>
              <label className="block font-semibold text-slate-500 mb-1 font-sans">POS Invoice Prefix *</label>
              <input
                type="text"
                required
                value={series.invoicePrefix}
                onChange={(e) => setSeries({ ...series, invoicePrefix: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1 font-sans">Purchase Order Prefix *</label>
              <input
                type="text"
                required
                value={series.poPrefix}
                onChange={(e) => setSeries({ ...series, poPrefix: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1 font-sans">Goods Inward GRN Prefix *</label>
              <input
                type="text"
                required
                value={series.grnPrefix}
                onChange={(e) => setSeries({ ...series, grnPrefix: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
              />
            </div>
          </div>
        </SettingsForm>
      </div>
    </div>
  );
}
