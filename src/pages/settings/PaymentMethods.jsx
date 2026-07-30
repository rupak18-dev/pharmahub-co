import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { SectionHeader } from '../../components/settings/SectionHeader';
import { SettingsForm } from '../../components/settings/SettingsForm';
import { ToggleSwitch } from '../../components/settings/ToggleSwitch';

export default function PaymentMethods() {
  const [cash, setCash] = useState(true);
  const [card, setCard] = useState(true);
  const [upi, setUpi] = useState(true);
  const [wallet, setWallet] = useState(false);
  const [credit, setCredit] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    alert('Tender payment options configurations saved.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionHeader
        title="Tender Payment Methods"
        subtitle="Manage billing checkout registers payment options (Cash, UPI QR, Credit ledger accounts)"
        icon={CreditCard}
      />

      <div className="saas-card rounded-2xl p-6">
        <SettingsForm onSubmit={handleSave}>
          <div className="space-y-2">
            <ToggleSwitch label="Enable Cash Checkout Registers" checked={cash} onChange={setCash} />
            <ToggleSwitch label="Enable Credit Card Terminals" checked={card} onChange={setCard} />
            <ToggleSwitch label="Enable UPI QR Code Billing" checked={upi} onChange={setUpi} />
            <ToggleSwitch label="Enable Digital Customer Wallet Payments" checked={wallet} onChange={setWallet} />
            <ToggleSwitch label="Enable Customer Outstanding Credit ledger Limits" checked={credit} onChange={setCredit} />
          </div>
        </SettingsForm>
      </div>
    </div>
  );
}
