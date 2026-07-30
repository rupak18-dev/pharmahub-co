import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { SectionHeader } from '../../components/settings/SectionHeader';
import { SettingsForm } from '../../components/settings/SettingsForm';
import { INITIAL_FY_SETTINGS } from '../../constants/settingsData';

export default function FinancialYear() {
  const [fy, setFy] = useState(INITIAL_FY_SETTINGS);

  const handleSave = (e) => {
    e.preventDefault();
    alert('Financial year parameters locked.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionHeader
        title="Financial Year & Ledger Locks"
        subtitle="Manage current accounting years and lock historical data entries"
        icon={Calendar}
      />

      <div className="saas-card rounded-2xl p-6">
        <SettingsForm onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Active Current Accounting FY *</label>
              <input
                type="text"
                required
                value={fy.currentFy}
                onChange={(e) => setFy({ ...fy, currentFy: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Accounting Years Lock Status</label>
              <select
                value={fy.lockStatus}
                onChange={(e) => setFy({ ...fy, lockStatus: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
              >
                <option value="Unlocked">Unlocked (Open for edits)</option>
                <option value="Locked">Locked (Immutable historical audit)</option>
              </select>
            </div>
          </div>
        </SettingsForm>
      </div>
    </div>
  );
}
