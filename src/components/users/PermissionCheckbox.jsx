import React from 'react';

export const PermissionCheckbox = ({ checked, onChange }) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 transition-colors cursor-pointer"
    />
  );
};
