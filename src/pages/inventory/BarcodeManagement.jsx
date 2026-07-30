import React, { useState } from 'react';
import { QrCode, Printer, RefreshCw, Copy, Check } from 'lucide-react';
import { INITIAL_MEDICINES } from '../../constants/inventoryData';
import { BarcodeCard } from '../../components/inventory/BarcodeCard';

export default function BarcodeManagement() {
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyBarcode = (barcode, id) => {
    navigator.clipboard?.writeText(barcode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <QrCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Barcode & QR Label Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate EAN-13 barcodes, preview thermal barcode labels, and batch print shelf tags
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Printer className="w-4 h-4" />
          <span>Batch Print All Barcode Labels</span>
        </button>
      </div>

      {/* Grid of Barcode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {medicines.map((med) => (
          <BarcodeCard key={med.id} medicine={med} />
        ))}
      </div>
    </div>
  );
}
