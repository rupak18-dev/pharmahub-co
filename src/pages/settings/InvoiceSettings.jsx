import React, { useState } from 'react';
import { Receipt } from 'lucide-react';
import { SectionHeader } from '../../components/settings/SectionHeader';
import { SettingsForm } from '../../components/settings/SettingsForm';
import { InvoicePreview } from '../../components/settings/InvoicePreview';
import { INITIAL_NUMBER_SERIES } from '../../constants/settingsData';

export default function InvoiceSettings() {
  const [prefix, setPrefix] = useState(INITIAL_NUMBER_SERIES.invoicePrefix);
  const [suffix, setSuffix] = useState(INITIAL_NUMBER_SERIES.invoiceSuffix);
  const [startNum, setStartNum] = useState(INITIAL_NUMBER_SERIES.invoiceStartNumber);
  const [paperSize, setPaperSize] = useState('Thermal 80mm');
  const [showLogo, setShowLogo] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    alert('Invoice printing layouts updated.');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <SectionHeader
        title="Invoice Formatter Settings"
        subtitle="Manage tax invoice print styles, paper sizes, and number formats"
        icon={Receipt}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 saas-card rounded-2xl p-6">
          <SettingsForm onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Invoice Prefix *</label>
                <input
                  type="text"
                  required
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Invoice Suffix *</label>
                <input
                  type="text"
                  required
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Starting Serial Number *</label>
                <input
                  type="number"
                  required
                  value={startNum}
                  onChange={(e) => setStartNum(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Print Paper Dimension *</label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
                >
                  <option value="Thermal 80mm">Thermal POS 80mm</option>
                  <option value="A4 Standard Page">A4 Page (Standard)</option>
                  <option value="A5 Landscape Format">A5 Page (Landscape)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="showLogo"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="showLogo" className="font-semibold text-slate-700 dark:text-slate-300">
                  Include Logo in Header
                </label>
              </div>
            </div>
          </SettingsForm>
        </div>

        <div className="md:col-span-1 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Active Receipt Preview</h4>
          <InvoicePreview
            prefix={prefix}
            suffix={suffix}
            startNumber={startNum}
            paperSize={paperSize}
            showLogo={showLogo}
          />
        </div>
      </div>
    </div>
  );
}
