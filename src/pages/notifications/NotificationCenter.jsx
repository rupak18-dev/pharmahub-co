import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Filter,
  ShieldAlert,
  Clock,
  CheckSquare,
  Activity,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';
import {
  INITIAL_NOTIFICATIONS,
  ERP_TASKS,
  PENDING_APPROVALS,
  TIMELINE_ACTIVITIES,
  REMINDERS_LIST
} from '../../constants/notificationData';
import { NotificationCard } from '../../components/notifications/NotificationCard';
import { PriorityBadge } from '../../components/notifications/PriorityBadge';

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  const categories = [
    'All',
    'Inventory',
    'Expiry',
    'Low Stock',
    'Purchases',
    'Suppliers',
    'Customers',
    'Billing',
    'Payments',
    'Credit',
    'Branch',
    'System',
    'AI Suggestions',
  ];

  const filtered = notifications.filter((n) => {
    const matchesCat = selectedCategory === 'All' || n.category === selectedCategory;
    const matchesPrio = selectedPriority === 'All' || n.priority === selectedPriority;
    return matchesCat && matchesPrio;
  });

  const handleAction = (actName, notif) => {
    alert(`Triggered Action "${actName}" for notification "${notif.title}"`);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'Read' })));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Operational Notification & Action Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Centralized ERP control hub for operational alerts, task assignments, approvals, and reminders
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* 5 Control Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-sans">
        <div
          onClick={() => navigate('/dashboard/notifications/alerts')}
          className="saas-card rounded-2xl p-3.5 space-y-1 hover:border-rose-500/40 cursor-pointer group"
        >
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Critical Alerts</span>
          </span>
          <h3 className="text-xl font-extrabold text-rose-500 font-mono">3 Active</h3>
        </div>

        <div
          onClick={() => navigate('/dashboard/notifications/tasks')}
          className="saas-card rounded-2xl p-3.5 space-y-1 hover:border-blue-500/40 cursor-pointer group"
        >
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Today's Tasks</span>
          </span>
          <h3 className="text-xl font-extrabold text-blue-600 font-mono">{ERP_TASKS.length} Assigned</h3>
        </div>

        <div
          onClick={() => navigate('/dashboard/notifications/approvals')}
          className="saas-card rounded-2xl p-3.5 space-y-1 hover:border-amber-500/40 cursor-pointer group"
        >
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Approvals</span>
          </span>
          <h3 className="text-xl font-extrabold text-amber-500 font-mono">{PENDING_APPROVALS.length} Requisitions</h3>
        </div>

        <div
          onClick={() => navigate('/dashboard/notifications/timeline')}
          className="saas-card rounded-2xl p-3.5 space-y-1 hover:border-purple-500/40 cursor-pointer group"
        >
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-purple-500" />
            <span>Recent Activities</span>
          </span>
          <h3 className="text-xl font-extrabold text-purple-500 font-mono">{TIMELINE_ACTIVITIES.length} Events</h3>
        </div>

        <div
          onClick={() => navigate('/dashboard/notifications/reminders')}
          className="saas-card rounded-2xl p-3.5 space-y-1 hover:border-emerald-500/40 cursor-pointer group"
        >
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Upcoming Reminders</span>
          </span>
          <h3 className="text-xl font-extrabold text-emerald-500 font-mono">{REMINDERS_LIST.length} Alerts</h3>
        </div>
      </div>

      {/* Category Pills & Priority Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong>{filtered.length}</strong> action items</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Filter Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-bold"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical Only</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Notifications Stream */}
      <div className="space-y-4">
        {filtered.map((notif) => (
          <NotificationCard key={notif.id} notification={notif} onAction={handleAction} />
        ))}
      </div>
    </div>
  );
}
