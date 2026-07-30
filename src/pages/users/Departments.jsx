import React, { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { INITIAL_DEPARTMENTS } from '../../constants/userData';
import { DepartmentCard } from '../../components/users/DepartmentCard';

export default function Departments() {
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);

  const handleAddDept = () => {
    alert('Create organizational department modal trigger.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Organizational Departments Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage corporate segments, code designations, and team allocations
          </p>
        </div>

        <button
          onClick={handleAddDept}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {departments.map((d) => (
          <DepartmentCard key={d.id} dept={d} />
        ))}
      </div>
    </div>
  );
}
