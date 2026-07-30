import React, { useState } from 'react';
import { Laptop, ShieldCheck } from 'lucide-react';
import { INITIAL_SESSIONS } from '../../constants/userData';
import { SessionCard } from '../../components/users/SessionCard';

export default function LoginSessions() {
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);

  const handleRevokeAll = () => {
    setSessions((prev) => prev.map((s) => s.current ? s : { ...s, logoutTime: 'Revoked' }));
    alert('All secondary sessions have been revoked.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <span>Active Login Sessions</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor and revoke active logins, verified devices, client web browsers, and terminal IP addresses
          </p>
        </div>

        <button
          onClick={handleRevokeAll}
          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-600/20"
        >
          <Laptop className="w-4 h-4" />
          <span>Revoke All Other Sessions</span>
        </button>
      </div>

      <div className="space-y-3">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} />
        ))}
      </div>
    </div>
  );
}
