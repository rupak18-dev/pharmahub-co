import React from 'react';
import { QrCode, Printer, Copy } from 'lucide-react';

export const BarcodeCard = ({ medicine }) => {
  return (
    <div className="saas-card rounded-2xl p-4 text-center space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400">SKU: {medicine.sku}</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">
          EAN-13
        </span>
      </div>

      <div>
        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{medicine.name}</h4>
        <p className="text-[10px] text-slate-400">{medicine.manufacturer}</p>
      </div>

      {/* SVG Barcode Visual Representation */}
      <div className="py-3 px-2 bg-white rounded-xl flex flex-col items-center justify-center border border-slate-200">
        <div className="flex items-center gap-0.5 h-12 w-48 justify-center overflow-hidden">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className={`h-full ${
                i % 2 === 0 ? 'bg-black' : 'bg-transparent'
              } ${i % 3 === 0 ? 'w-1.5' : i % 5 === 0 ? 'w-1' : 'w-0.5'}`}
            />
          ))}
        </div>
        <span className="font-mono text-[10px] tracking-widest text-black font-bold mt-1">
          {medicine.barcode}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => window.print()}
          className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-blue-600/20"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Label</span>
        </button>
      </div>
    </div>
  );
};
