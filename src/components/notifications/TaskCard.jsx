import React from 'react';
import { CheckSquare, Square, Calendar, User } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';

export const TaskCard = ({ task, onToggle }) => {
  const isDone = task.status === 'Completed';

  return (
    <div className="saas-card rounded-2xl p-4 flex items-start gap-3">
      <button
        onClick={() => onToggle && onToggle(task.id)}
        className="mt-0.5 text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform"
      >
        {isDone ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
      </button>

      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`font-bold text-xs ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
            {task.title}
          </h4>
          <PriorityBadge priority={task.priority} />
        </div>

        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-blue-600" />
            <span>{task.assignee}</span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-600" />
            <span>Due: {task.dueDate}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
