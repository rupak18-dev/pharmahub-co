import React, { useState } from 'react';
import { QrCode, Camera, Zap } from 'lucide-react';
import { INITIAL_MEDICINES } from '../../constants/inventoryData';

export const BarcodeInput = ({ onBarcodeMatch }) => {
  const [barcode, setBarcode] = useState('');
  const [scannerActive, setScannerActive] = useState(true);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && barcode.trim()) {
      const match = INITIAL_MEDICINES.find((m) => m.barcode === barcode.trim());
      if (match) {
        onBarcodeMatch(match);
        setBarcode('');
      } else {
        alert(`Barcode "${barcode}" not found in inventory.`);
      }
    }
  };

  return (
    <div className="saas-card rounded-2xl p-3 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 flex-1">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <QrCode className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scan barcode with USB scanner or type EAN number & press Enter..."
          className="w-full bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-mono"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <Zap className="w-3 h-3 animate-pulse" />
          <span>USB Scanner Active</span>
        </span>
        <button
          type="button"
          onClick={() => alert('Camera scanner placeholder triggered.')}
          className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600"
          title="Toggle Camera Scanner"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
