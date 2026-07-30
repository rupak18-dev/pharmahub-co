import React, { useState } from 'react';
import { Users as UsersIcon, Plus, LayoutGrid, Table as TableIcon, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { INITIAL_ENTERPRISE_USERS } from '../../constants/userData';
import { UserCard } from '../../components/users/UserCard';
import { UserTable } from '../../components/users/UserTable';
import { SearchBar } from '../../components/inventory/SearchBar';
import { ConfirmationDialog } from '../../components/inventory/ConfirmationDialog';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(INITIAL_ENTERPRISE_USERS);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'grid' | 'table'
  const [deletingUser, setDeletingUser] = useState(null);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirm = () => {
    if (deletingUser) {
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Total Enterprise Users</span>
          <h3 className="text-2xl font-extrabold text-blue-600">{users.length} Account(s)</h3>
        </div>

        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Online Staff Sessions</span>
          <h3 className="text-2xl font-extrabold text-emerald-500">2 Active</h3>
        </div>

        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">System Roles</span>
          <h3 className="text-2xl font-extrabold text-purple-500">4 Roles</h3>
        </div>

        <div className="saas-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Departments</span>
          <h3 className="text-2xl font-extrabold text-amber-500">6 Groups</h3>
        </div>
      </div>

      {/* Main Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Enterprise Employee User Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage multi-tenant login profiles, assign security roles, and lock user access controls
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
            onClick={() => navigate('/dashboard/users/new')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create User Account</span>
          </button>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search staff profile by name, email, or role..." />

      {/* Grid or Table render */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      ) : (
        <UserTable
          users={filtered}
          onEdit={(u) => alert(`Edit profile for ${u.name}`)}
          onDelete={(u) => setDeletingUser(u)}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteConfirm}
        title="Revoke User Profile?"
        message={`Are you sure you want to completely suspend and delete user "${deletingUser?.name}" from PharmaHub ERP?`}
        confirmText="Revoke Access"
      />
    </div>
  );
}
