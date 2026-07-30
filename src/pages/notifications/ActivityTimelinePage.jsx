import React from 'react';
import { Activity } from 'lucide-react';
import { TIMELINE_ACTIVITIES } from '../../constants/notificationData';
import { TimelineCard } from '../../components/notifications/TimelineCard';

export default function ActivityTimelinePage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-500" />
          <span>Real-time Operational Activity Audit Stream</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Live stream of pharmacy transactions, stock adjustments, customer entries, and order approvals
        </p>
      </div>

      <div className="space-y-3">
        {TIMELINE_ACTIVITIES.map((act) => (
          <TimelineCard key={act.id} activity={act} />
        ))}
      </div>
    </div>
  );
}
