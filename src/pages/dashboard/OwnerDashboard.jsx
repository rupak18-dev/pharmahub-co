import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  ShoppingBag,
  Package,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  CalendarOff,
  Plus,
  FileText,
  Truck,
  Activity,
  PackageSearch,
  PlusCircle
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { QuickActionCard } from '../../components/ui/QuickActionCard';
import { SectionCard } from '../../components/ui/SectionCard';
import { RecentActivityCard } from '../../components/ui/RecentActivityCard';
import { NotificationCard } from '../../components/ui/NotificationCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export default function OwnerDashboard() {
  const [showSkeletonDemo, setShowSkeletonDemo] = useState(false);

  // Placeholder Activity Data
  const recentActivities = [
    {
      id: 1,
      title: 'POS Tax Invoice #INV-9821 Generated',
      description: 'Sale of ₹1,850 completed via UPI at Central Counter.',
      timestamp: '5 mins ago',
      icon: IndianRupee,
      badge: 'Completed',
    },
    {
      id: 2,
      title: 'Inward Stock Purchase Recorded',
      description: '500 units of Amoxicillin 500mg received from Sun Pharma.',
      timestamp: '25 mins ago',
      icon: Package,
      badge: 'Inward PO',
    },
    {
      id: 3,
      title: 'Low Stock Threshold Reached',
      description: 'Paracetamol 650mg is down to 42 units (Min: 100).',
      timestamp: '1 hour ago',
      icon: AlertTriangle,
      badge: 'Stock Alert',
    },
    {
      id: 4,
      title: 'Drug License Renewal Status Verified',
      description: '20B & 21B licenses active through Dec 2028.',
      timestamp: '3 hours ago',
      icon: Activity,
      badge: 'Compliance',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Premium Welcome Header */}
      <div className="saas-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-500/5 to-emerald-500/10 border-blue-500/20 rounded-[28px]">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Owner Operations <span className="text-blue-600 dark:text-blue-400">Control Panel</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise Pharmacy SaaS • Multi-branch analytics & operational watchlist
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSkeletonDemo(!showSkeletonDemo)}
            className="px-4 py-2.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            {showSkeletonDemo ? 'Hide Skeleton View' : 'Demo Loading Skeletons'}
          </button>
        </div>
      </div>

      {showSkeletonDemo ? (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400">Loading Skeleton Demo State:</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <LoadingSkeleton count={1} height="h-28" />
            <LoadingSkeleton count={1} height="h-28" />
            <LoadingSkeleton count={1} height="h-28" />
            <LoadingSkeleton count={1} height="h-28" />
          </div>
          <LoadingSkeleton count={3} height="h-16" />
        </div>
      ) : (
        <>
          {/* Stat Cards Grid - Displaying Sage Green, Lavender, White and Peach layout presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Today's Sales"
              value="₹24,850.00"
              change="NORMAL"
              isPositive={true}
              icon={IndianRupee}
              variant="white"
              subtext="42 invoices processed today"
            />
            <StatCard
              title="Inventory Value"
              value="₹18,45,000"
              change="NORMAL"
              isPositive={true}
              icon={Package}
              variant="sage"
              subtext="2,480 cataloged SKUs"
            />
            <StatCard
              title="Today's Purchases"
              value="₹14,200.00"
              change="NORMAL"
              isPositive={true}
              icon={ShoppingBag}
              variant="peach"
              subtext="2 supplier shipments inward"
            />
            <StatCard
              title="Net Profit (Est.)"
              value="₹8,420.00"
              change="SYS 96"
              isPositive={true}
              icon={TrendingUp}
              variant="lavender"
              subtext="28% average margin rate"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 font-mono text-xs">
            <div className="saas-card rounded-[24px] p-5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Pending Payments</span>
              <h3 className="text-xl font-extrabold text-amber-500">₹42,100.00</h3>
              <p className="text-[10px] text-slate-400 font-sans mt-2">Due within 15 days</p>
            </div>

            <div className="saas-card rounded-[24px] p-5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Low Stock Alert</span>
              <h3 className="text-xl font-extrabold text-amber-500">8 Items</h3>
              <p className="text-[10px] text-slate-400 font-sans mt-2">Below minimum threshold</p>
            </div>

            <div className="saas-card rounded-[24px] p-5 space-y-1 border-rose-500/20">
              <span className="text-[10px] font-bold text-rose-500 uppercase font-sans">Expiry Alerts</span>
              <h3 className="text-xl font-extrabold text-rose-500">5 Batches</h3>
              <p className="text-[10px] text-slate-400 font-sans mt-2">Within next 60 days</p>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <SectionCard title="Quick Executive Actions" subtitle="Frequently used shortcuts for fast workflow execution">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionCard
                title="New POS Billing"
                description="Launch counter checkout"
                icon={Plus}
                variant="emerald"
                badge="Hot"
              />
              <QuickActionCard
                title="Stock Inward Entry"
                description="Record supplier shipment"
                icon={PackageSearch}
                variant="blue"
              />
              <QuickActionCard
                title="Create Purchase Order"
                description="Draft PO for distributors"
                icon={Truck}
                variant="indigo"
              />
              <QuickActionCard
                title="Financial Reports"
                description="View profit & GST liability"
                icon={FileText}
                variant="amber"
              />
            </div>
          </SectionCard>

          {/* Grid Layout: Recent Activity Feed & Notification Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity Feed (2 Cols) */}
            <SectionCard
              title="Live Audit & Activity Stream"
              subtitle="Real-time system events across all counters"
              className="lg:col-span-2"
            >
              <RecentActivityCard activities={recentActivities} />
            </SectionCard>

            {/* Notifications & System Alerts (1 Col) */}
            <SectionCard
              title="Operational System Alerts"
              subtitle="Priority notifications requiring owner review"
            >
              <div className="space-y-3">
                <NotificationCard
                  type="warning"
                  title="Low Stock Threshold Reached"
                  message="Atorvastatin 10mg is down to 12 units. Reorder recommended."
                  time="10m ago"
                />
                <NotificationCard
                  type="danger"
                  title="Batch Expiry Alert"
                  message="Azithromycin 500mg batch #AZI-1029 expires next month."
                  time="45m ago"
                />
                <NotificationCard
                  type="success"
                  title="Daily Sales Goal Reached"
                  message="Central branch achieved target of ₹20,000 daily sales."
                  time="2h ago"
                />
              </div>
            </SectionCard>
          </div>

          {/* Empty State Component Preview */}
          <SectionCard title="Empty State Component Preview" subtitle="Demonstrating clean empty state layout when no data exists">
            <EmptyState
              icon={PackageSearch}
              title="No Pending Vendor Returns"
              description="All expired batches have been returned or processed. Your inventory return queue is completely clear."
              action={
                <button className="px-5 py-2.5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow transition-all hover:scale-105">
                  Check Batches
                </button>
              }
            />
          </SectionCard>
        </>
      )}
    </div>
  );
}
