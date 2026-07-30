import React from 'react';
import { QrCode, Banknote, CreditCard, Wallet, ShieldAlert, Split } from 'lucide-react';

export const PaymentCard = ({ selectedMode, onSelectMode }) => {
  const modes = [
    { id: 'UPI / QR', label: 'UPI / QR', icon: QrCode },
    { id: 'Cash', label: 'Cash', icon: Banknote },
    { id: 'Card', label: 'Card', icon: CreditCard },
    { id: 'Wallet', label: 'Wallet', icon: Wallet },
    { id: 'Store Credit', label: 'Credit', icon: ShieldAlert },
  ];

  return (
    <div className="saas-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Payment Method (F9)
        </h4>
        <button
          type="button"
          onClick={() => alert('Split payment option placeholder.')}
          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <Split className="w-3 h-3" />
          <span>Split Payment</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {modes.map((pm) => {
          const Icon = pm.icon;
          const isSelected = selectedMode === pm.id;
          return (
            <button
              key={pm.id}
              type="button"
              onClick={() => onSelectMode(pm.id)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 scale-[1.02]'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-500'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[11px]">{pm.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
