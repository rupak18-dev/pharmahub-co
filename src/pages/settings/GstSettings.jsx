import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { SectionHeader } from '../../components/settings/SectionHeader';
import { SettingsForm } from '../../components/settings/SettingsForm';
import { INITIAL_TAX_SETTINGS } from '../../constants/settingsData';

export default function GstSettings() {
  const [tax, setTax] = useState(INITIAL_TAX_SETTINGS);

  const handleSave = (e) => {
    e.preventDefault();
    alert('GST tax default parameters saved.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionHeader
        title="Tax & GST Default Settings"
        subtitle="Manage default GST slabs, state tax code boundaries, and HSN codes"
        icon={FileSpreadsheet}
      />

      <div className="saas-card rounded-2xl p-6">
        <SettingsForm onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">State POS Tax Rule Location *</label>
              <input
                type="text"
                required
                value={tax.stateCode}
                onChange={(e) => setTax({ ...tax, stateCode: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">Active GST Percentage Slabs</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
              {tax.gstPercentages.map((slab) => (
                <div key={slab.rate} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <p className="font-bold text-slate-900 dark:text-white">{slab.rate}%</p>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">{slab.label.split(' ')[0]}</p>
                </div>
              ))}
            </div>
          </div>
        </SettingsForm>
      </div>
    </div>
  );
}
