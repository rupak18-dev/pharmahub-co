import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, ShieldCheck, MapPin, Activity, ShieldAlert } from 'lucide-react';
import { INITIAL_ENTERPRISE_USERS, INITIAL_ACTIVITY_LOGS, INITIAL_SESSIONS } from '../../constants/userData';

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('activities'); // 'activities' | 'sessions' | 'permissions'

  const userObj = INITIAL_ENTERPRISE_USERS.find((u) => u.id === id) || INITIAL_ENTERPRISE_USERS[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/users')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to User Directory</span>
        </button>
      </div>

      {/* User summary header */}
      <div className="saas-card rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-4">
            <img
              src={userObj.avatar}
              alt={userObj.name}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-800"
            />
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{userObj.name}</h1>
              <p className="text-xs text-slate-400 font-mono">Employee ID: {userObj.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>{userObj.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>{userObj.phone}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Security Role</span>
          <h3 className="text-xl font-extrabold text-blue-600 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5" />
            <span>{userObj.role}</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">Assigned Branch: <strong>{userObj.branch}</strong></p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'activities', label: 'User Activity Logs', icon: Activity },
          { id: 'sessions', label: 'Login Sessions Logs', icon: ShieldAlert },
          { id: 'permissions', label: 'Security Permissions View', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Workspace */}
      <div className="saas-card rounded-2xl p-5">
        {activeTab === 'activities' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions Log</h3>
            <div className="space-y-2">
              {INITIAL_ACTIVITY_LOGS.filter((log) => log.user === userObj.name).map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border flex justify-between text-xs">
                  <div>
                    <span className="font-bold text-blue-600">{log.action}:</span> {log.details}
                  </div>
                  <span className="text-slate-400">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active & Historical Browser Sessions</h3>
            <div className="space-y-2">
              {INITIAL_SESSIONS.filter((s) => s.user === userObj.name).map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border flex justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{s.device} ({s.browser})</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">IP: {s.ip}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-slate-400 text-[10px] block">Login: {s.loginTime}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-bold">
                      {s.logoutTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Inherited Role-Based Permissions</h3>
            <p className="text-slate-500">This user inherits administrative parameters matching the <strong>{userObj.role}</strong> role group.</p>
          </div>
        )}
      </div>
    </div>
  );
}
