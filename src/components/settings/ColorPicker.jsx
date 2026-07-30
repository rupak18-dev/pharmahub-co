import React from 'react';

export const ColorPicker = ({ value, onChange }) => {
  const colors = [
    { name: 'Pharma Blue', hex: '#2563eb' },
    { name: 'Emerald Green', hex: '#10b981' },
    { name: 'Amethyst Purple', hex: '#8b5cf6' },
    { name: 'Sunset Amber', hex: '#f59e0b' },
    { name: 'Crimson Rose', hex: '#f43f5e' },
  ];

  return (
    <div className="space-y-2">
      <label className="block font-semibold text-slate-500">Select Brand Primary Color</label>
      <div className="flex gap-2">
        {colors.map((c) => (
          <button
            key={c.hex}
            type="button"
            onClick={() => onChange && onChange(c.hex)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              value === c.hex
                ? 'border-slate-900 dark:border-white scale-110 shadow'
                : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: c.hex }}
            title={c.name}
          />
        ))}
      </div>
    </div>
  );
};
