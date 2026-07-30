import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { SectionHeader } from '../../components/settings/SectionHeader';
import { SettingsForm } from '../../components/settings/SettingsForm';
import { INITIAL_COMPANY_PROFILE } from '../../constants/settingsData';

export default function CompanyProfile() {
  const [profile, setProfile] = useState(INITIAL_COMPANY_PROFILE);

  const handleSave = (e) => {
    e.preventDefault();
    alert('Corporate trade profile saved successfully.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionHeader
        title="Corporate Profile Settings"
        subtitle="Manage company addresses, corporate email, PAN registrations, and trade business models"
        icon={Building2}
      />

      <div className="saas-card rounded-2xl p-6">
        <SettingsForm onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Company Trade Name *</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Business Operating Model *</label>
              <input
                type="text"
                required
                value={profile.businessType}
                onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">PAN Number *</label>
              <input
                type="text"
                required
                value={profile.pan}
                onChange={(e) => setProfile({ ...profile, pan: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">GSTIN Number *</label>
              <input
                type="text"
                required
                value={profile.gstin}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Drug License (20B) *</label>
              <input
                type="text"
                required
                value={profile.drugLicense20B}
                onChange={(e) => setProfile({ ...profile, drugLicense20B: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Corporate Email Address *</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Corporate Contact Line *</label>
              <input
                type="text"
                required
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Registered Address *</label>
            <input
              type="text"
              required
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
            />
          </div>
        </SettingsForm>
      </div>
    </div>
  );
}
