import React, { useState } from 'react';
import { ShieldCheck, Plus, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { INITIAL_ROLES } from '../../constants/userData';
import { RoleCard } from '../../components/users/RoleCard';
import { RoleTable } from '../../components/users/RoleTable';
import { SearchBar } from '../../components/inventory/SearchBar';
import { ConfirmationDialog } from '../../components/inventory/ConfirmationDialog';

export default function Roles() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [deletingRole, setDeletingRole] = useState(null);

  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirm = () => {
    if (deletingRole) {
      setRoles((prev) => prev.filter((r) => r.id !== deletingRole.id));
      setDeletingRole(null);
    }
  };

  const handleClone = (r) => {
    const clone = {
      ...r,
      id: `ROLE-${Math.floor(Math.random() * 1000)}`,
      name: `${r.name}_CLONE`,
      userCount: 0,
    };
    setRoles((prev) => [...prev, clone]);
    alert(`Role ${r.name} cloned successfully as ${clone.name}!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Enterprise Security Roles Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure system roles, clone user settings templates, and adjust multi-department hierarchies
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggler */}
          <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => navigate('/dashboard/roles/new')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Role</span>
          </button>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search system roles by name, key, description..." />

      {/* Grid or Table render */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <RoleCard
              key={r.id}
              role={r}
              onClone={handleClone}
              onEdit={(role) => navigate(`/dashboard/roles/${role.id}`)}
              onDelete={(role) => setDeletingRole(role)}
            />
          ))}
        </div>
      ) : (
        <RoleTable
          roles={filtered}
          onClone={handleClone}
          onEdit={(role) => navigate(`/dashboard/roles/${role.id}`)}
          onDelete={(role) => setDeletingRole(role)}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Security Role?"
        message={`Are you sure you want to completely delete role "${deletingRole?.name}"? All assigned users will lose permissions.`}
        confirmText="Delete Role"
      />
    </div>
  );
}
