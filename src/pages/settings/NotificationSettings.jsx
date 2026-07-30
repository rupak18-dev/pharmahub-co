import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { SectionHeader } from '../../components/settings/SectionHeader';
import { SettingsForm } from '../../components/settings/SettingsForm';
import { ToggleSwitch } from '../../components/settings/ToggleSwitch';

export default function NotificationSettings() {
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [expiryAlert, setExpiryAlert] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [creditAlert, setCreditAlert] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    alert('System notifications preferences rules updated.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionHeader
        title="Notification Rules & Preferences"
        subtitle="Manage dispatch rules for stock updates, expiry alerts, and payment ledger updates"
        icon={Bell}
      />

      <div className="saas-card rounded-2xl p-6">
        <SettingsForm onSubmit={handleSave}>
          <div className="space-y-2">
            <ToggleSwitch label="Email System Notifications" checked={email} onChange={setEmail} />
            <ToggleSwitch label="SMS Operations Notifications" checked={sms} onChange={setSms} />
            <ToggleSwitch label="WhatsApp Refill Notifications" checked={whatsapp} onChange={setWhatsapp} />
            <ToggleSwitch label="Browser Push Notifications" checked={pushNotif} onChange={setPushNotif} />
            <ToggleSwitch label="Stock Expiration Warnings" checked={expiryAlert} onChange={setExpiryAlert} />
            <ToggleSwitch label="Low Stock Reorder Notifications" checked={lowStockAlert} onChange={setLowStockAlert} />
            <ToggleSwitch label="Patient Credit Limit Warnings" checked={creditAlert} onChange={setCreditAlert} />
          </div>
        </SettingsForm>
      </div>
    </div>
  );
}
