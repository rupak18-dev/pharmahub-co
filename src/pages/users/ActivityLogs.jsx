import React, { useState } from 'react';
import { Activity, Printer } from 'lucide-react';
import { INITIAL_ACTIVITY_LOGS } from '../../constants/userData';
import { ActivityCard } from '../../components/users/ActivityCard';

export default function ActivityLogs() {
  const [logs, setLogs] = useState(INITIAL_ACTIVITY_LOGS);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Operational Audit Trail Logs</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable audit record of user security actions (*Login, Logout, Create, Update, Delete, Approve, Export*)
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Printer className="w-4 h-4" />
          <span>Print Audit Log</span>
        </button>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <ActivityCard key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}
