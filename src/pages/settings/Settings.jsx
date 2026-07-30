import React from 'react';
import {
  Settings as SettingsIcon,
  Building,
  SlidersHorizontal,
  Receipt,
  FileSpreadsheet,
  Calendar,
  CreditCard,
  Bell,
  Sparkles,
  Database,
  Upload,
  Lock
} from 'lucide-react';
import { SettingsCard } from '../../components/settings/SettingsCard';

export default function Settings() {
  const menuItems = [
    { title: 'Company Profile', description: 'Configure corporate address, trading name, and contact details', icon: Building, path: '/dashboard/settings/profile' },
    { title: 'Local Branch Customization', description: 'Setup receipt layouts, logos, and custom address templates per branch', icon: SlidersHorizontal, path: '/dashboard/settings/branches' },
    { title: 'Invoice Formatter', description: 'Design tax invoice layouts, invoice prefixes, suffixes, and printing paper dimensions', icon: Receipt, path: '/dashboard/settings/invoices' },
    { title: 'Tax & GST Rates', description: 'Adjust default GST slabs, state tax code allocations, and default HSN configurations', icon: FileSpreadsheet, path: '/dashboard/settings/gst' },
    { title: 'Financial Year Locks', description: 'Manage current and historical FY, edit accounting cutoff gates, and lock years', icon: Calendar, path: '/dashboard/settings/financial-year' },
    { title: 'Invoice Number Series', description: 'Configure auto-incrementing serial number prefix templates for invoices/GRNs', icon: Lock, path: '/dashboard/settings/number-series' },
    { title: 'Tender Payment Methods', description: 'Enable cashier receipt checkout payment channels (UPI, wallets, card registers)', icon: CreditCard, path: '/dashboard/settings/payments' },
    { title: 'System Notifications preferences', description: 'Toggle email, SMS alerts, and stock expiration alert dispatches', icon: Bell, path: '/dashboard/settings/notifications' },
    { title: 'Interface Theme & Logo Assets', description: 'Switch dark theme toggles, modify brand primary colors, and upload logos', icon: Sparkles, path: '/dashboard/settings/theme' },
    { title: 'Data Backup Snapshot', description: 'Download complete ERP records backup or restore database snapshots', icon: Database, path: '/dashboard/settings/backup' },
    { title: 'Import & Export Registers', description: 'Inward compile drug registries, customer registers, and suppliers via spreadsheets', icon: Upload, path: '/dashboard/settings/import-export' },
    { title: 'Security Audit Logs', description: 'Configure system log retention and security policies', icon: Lock, path: '/dashboard/settings/audit' },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs font-mono">
        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Company Status</span>
          <h3 className="text-2xl font-extrabold text-blue-600 font-sans">Verified Chain</h3>
        </div>

        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Financial Year</span>
          <h3 className="text-2xl font-extrabold text-emerald-500">FY 26-27</h3>
        </div>

        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">GST Status</span>
          <h3 className="text-2xl font-extrabold text-purple-500 font-sans">Compliant</h3>
        </div>

        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Outlets Registered</span>
          <h3 className="text-2xl font-extrabold text-amber-500">3 Branches</h3>
        </div>

        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">User Accounts</span>
          <h3 className="text-2xl font-extrabold text-indigo-500">4 Active</h3>
        </div>
      </div>

      {/* Main Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>System Configurations & SaaS Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure corporate profiles, tax percentages, billing layouts, payment gateways, and data snapshot backups
        </p>
      </div>

      {/* Settings Grid list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <SettingsCard
            key={item.title}
            title={item.title}
            description={item.description}
            icon={item.icon}
            path={item.path}
          />
        ))}
      </div>
    </div>
  );
}
