import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Save } from 'lucide-react';
import { INITIAL_DEPARTMENTS, INITIAL_DESIGNATIONS } from '../../constants/userData';
import { INITIAL_BRANCHES } from '../../constants/branchData';

export default function CreateUser() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [empId, setEmpId] = useState('EMP-005');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('PharmaHub2026!');
  const [role, setRole] = useState('PHARMACIST');
  const [dept, setDept] = useState(INITIAL_DEPARTMENTS[0].name);
  const [designation, setDesignation] = useState(INITIAL_DESIGNATIONS[0].name);
  const [branch, setBranch] = useState(INITIAL_BRANCHES[0].name);
  const [status, setStatus] = useState('Active');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Successfully created new User profile account for ${name} (${empId})!`);
    navigate('/dashboard/users');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/users')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to User Directory</span>
        </button>
      </div>

      <div className="saas-card rounded-2xl p-6 space-y-5">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Create New User Login Account</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Employee Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anil Kumar"
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Employee ID designation *</label>
              <input
                type="text"
                required
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@pharmahub.com"
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98201 12345"
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Temporary Password Placeholder *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">System Security Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
              >
                <option value="OWNER">OWNER</option>
                <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
                <option value="PHARMACIST">PHARMACIST</option>
                <option value="CASHIER">CASHIER</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Organizational Department *</label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
              >
                {INITIAL_DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Employee Designation *</label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
              >
                {INITIAL_DESIGNATIONS.map((des) => (
                  <option key={des.id} value={des.name}>{des.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Assigned Branch Location *</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
              >
                {INITIAL_BRANCHES.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/users')}
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Create Account Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
