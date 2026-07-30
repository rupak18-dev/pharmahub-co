import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { SectionHeader } from '../../components/settings/SectionHeader';
import { SettingsForm } from '../../components/settings/SettingsForm';
import { ColorPicker } from '../../components/settings/ColorPicker';
import { ThemePreview } from '../../components/settings/ThemePreview';
import { ToggleSwitch } from '../../components/settings/ToggleSwitch';

export default function ThemeBranding() {
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [sidebarStyle, setSidebarStyle] = useState('dark');
  const [isDark, setIsDark] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    alert('UI branding settings saved. Primary color applied.');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <SectionHeader
        title="Interface Customization & Theme Branding"
        subtitle="Manage brand primary colors, navigation sidebar layouts, and display compact sizes"
        icon={Sparkles}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 saas-card rounded-2xl p-6">
          <SettingsForm onSubmit={handleSave}>
            <ColorPicker value={primaryColor} onChange={setPrimaryColor} />

            <div className="mt-4">
              <label className="block font-semibold text-slate-500 mb-1">Sidebar Color Style *</label>
              <select
                value={sidebarStyle}
                onChange={(e) => setSidebarStyle(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-950 dark:text-white"
              >
                <option value="dark">Dark Theme Sidebar</option>
                <option value="light">Light Theme Sidebar</option>
              </select>
            </div>

            <div className="space-y-2 mt-4">
              <ToggleSwitch label="Compact Spacing Mode" checked={isCompact} onChange={setIsCompact} />
              <ToggleSwitch label="Enable Global Dark Theme" checked={isDark} onChange={setIsDark} />
            </div>
          </SettingsForm>
        </div>

        <div className="md:col-span-1 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Active Display Preview</h4>
          <ThemePreview
            primaryColor={primaryColor}
            sidebarStyle={sidebarStyle}
            isDark={isDark}
            isCompact={isCompact}
          />
        </div>
      </div>
    </div>
  );
}
