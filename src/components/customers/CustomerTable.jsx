import React from 'react';
import { Eye, Edit, Trash2, Phone, Mail, Award, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomerTable = ({ customers = [], onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div className="saas-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-900/90 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="py-3.5 px-4">Customer Details</th>
              <th className="py-3.5 px-4">Contact Info</th>
              <th className="py-3.5 px-4">Gender & Age</th>
              <th className="py-3.5 px-4">Loyalty Points</th>
              <th className="py-3.5 px-4">Wallet Balance</th>
              <th className="py-3.5 px-4">Outstanding Bal</th>
              <th className="py-3.5 px-4">Last Visit</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="py-3.5 px-4">
                  <button
                    onClick={() => navigate(`/dashboard/customers/${c.id}`)}
                    className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left block text-xs"
                  >
                    {c.name}
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono block">{c.id} • {c.membershipTier}</span>
                </td>

                <td className="py-3.5 px-4 font-mono text-[11px]">
                  <span className="text-slate-800 dark:text-slate-200 block">{c.phone}</span>
                  <span className="text-slate-400 text-[10px] block">{c.email}</span>
                </td>

                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                  {c.gender}, {c.age} yrs
                </td>

                <td className="py-3.5 px-4 font-mono font-bold text-amber-500 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{c.loyaltyPoints} pts</span>
                </td>

                <td className="py-3.5 px-4 font-mono font-bold text-emerald-500">
                  ₹{c.walletBalance.toFixed(2)}
                </td>

                <td className="py-3.5 px-4 font-mono">
                  <span className={`font-bold ${c.outstandingAmount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                    ₹{c.outstandingAmount.toFixed(2)}
                  </span>
                </td>

                <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                  {c.lastVisit}
                </td>

                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.status.includes('Credit')
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}>
                    {c.status}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/dashboard/customers/${c.id}`)}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all"
                      title="View Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(c)}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                      title="Edit Customer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(c)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
