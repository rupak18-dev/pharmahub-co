import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { SectionHeader } from '../../components/settings/SectionHeader';
import { SettingsForm } from '../../components/settings/SettingsForm';
import { ToggleSwitch } from '../../components/settings/ToggleSwitch';

export default function AuditSettings() {
  const [retention, setRetention] = useState('365 Days');
  const [logLogins, setLogLogins] = useState(true);
  const [logStockEdits, setLogStockEdits] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    alert('Security audit retention parameters locked.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionHeader
        title="Security Audit Logs Settings"
        subtitle="Manage system log retention policies, database override locks, and administrative logs"
        icon={Lock}
      />

      <div className="saas-card rounded-2xl p-6">
        <SettingsForm onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Audit Log Retention Window *</label>
              <select
                value={retention}
                onChange={(e) => setRetention(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
              >
                <option value="90 Days">90 Days</option>
                <option value="180 Days">180 Days</option>
                <option value="365 Days">365 Days (1 Year Standard)</option>
                <option value="7 Years">7 Years (Corporate Compliance)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <ToggleSwitch label="Audit and Log Every Staff Login Session" checked={logLogins} onChange={setLogLogins} />
            <ToggleSwitch label="Log Every Manual Inventory Stock Level Write-off" checked={logStockEdits} onChange={setLogStockEdits} />
          </div>
        </SettingsForm>
      </div>
    </div>
  );
}
