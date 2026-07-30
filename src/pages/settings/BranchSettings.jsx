import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { SectionHeader } from '../../components/settings/SectionHeader';
import { SettingsForm } from '../../components/settings/SettingsForm';
import { INITIAL_BRANCHES } from '../../constants/branchData';

export default function BranchSettings() {
  const [selectedBranch, setSelectedBranch] = useState(INITIAL_BRANCHES[0].name);
  const [receiptHeader, setReceiptHeader] = useState('Thank you for choosing PharmaHub. Get well soon!');

  const handleSave = (e) => {
    e.preventDefault();
    alert(`Local branch receipt formatting overrides saved for ${selectedBranch}.`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionHeader
        title="Local Branch Adjustments"
        subtitle="Manage branch level receipt formats, terminal cash limits, and customized layouts"
        icon={SlidersHorizontal}
      />

      <div className="saas-card rounded-2xl p-6">
        <SettingsForm onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Target Branch to Configure *</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
              >
                {INITIAL_BRANCHES.map((b) => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">POS Custom Receipt Header Remarks</label>
              <input
                type="text"
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
              />
            </div>
          </div>
        </SettingsForm>
      </div>
    </div>
  );
}
