import React, { useState } from 'react';
import { CheckSquare, Plus, Filter } from 'lucide-react';
import { ERP_TASKS } from '../../constants/notificationData';
import { TaskCard } from '../../components/notifications/TaskCard';

export default function TasksPage() {
  const [tasks, setTasks] = useState(ERP_TASKS);
  const [filter, setFilter] = useState('All'); // 'All' | 'Pending' | 'Completed' | 'Overdue'

  const handleToggle = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t
      )
    );
  };

  const filtered = tasks.filter((t) => (filter === 'All' ? true : t.status === filter));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Staff Task & Requisition Assignments</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Assign inventory audits, vendor payment follow-ups, and prescription calls to staff
          </p>
        </div>

        <button
          onClick={() => alert('New Task assignment modal trigger.')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Assign New Task</span>
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {['All', 'Pending', 'Overdue', 'Completed'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === st
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
            }`}
          >
            {st} Tasks
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((t) => (
          <TaskCard key={t.id} task={t} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  );
}
