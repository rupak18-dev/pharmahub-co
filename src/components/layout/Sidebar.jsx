import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Receipt,
  Package,
  ShoppingCart,
  Users,
  Building,
  BarChart2,
  Bell,
  Bot,
  Settings,
  LogOut,
  Pill,
  ChevronLeft,
  ChevronRight,
  X,
  Warehouse,
  ArrowLeftRight,
  ShieldCheck,
  Laptop
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Billing', path: '/dashboard/billing', icon: Receipt },
    { name: 'Inventory', path: '/dashboard/inventory', icon: Package },
    { name: 'Purchase', path: '/dashboard/purchases', icon: ShoppingCart },
    { name: 'Customers', path: '/dashboard/customers', icon: Users },
    { name: 'Suppliers', path: '/dashboard/suppliers', icon: Building },
    { name: 'Branches', path: '/dashboard/branches', icon: Building },
    { name: 'Warehouses', path: '/dashboard/warehouses', icon: Warehouse },
    { name: 'Stock Transfers', path: '/dashboard/transfers', icon: ArrowLeftRight },
    { name: 'Users Directory', path: '/dashboard/users', icon: Users },
    { name: 'Security Roles', path: '/dashboard/roles', icon: ShieldCheck },
    { name: 'Sessions & Logs', path: '/dashboard/sessions', icon: Laptop },
    { name: 'Reports', path: '/dashboard/reports', icon: BarChart2 },
    { name: 'Notifications', path: '/dashboard/notifications', icon: Bell, badge: '3' },
    { name: 'AI Assistant', path: '/dashboard/ai-assistant', icon: Bot, badge: 'New' },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const sidebarVariants = {
    expanded: { width: '16rem' },
    collapsed: { width: '4.5rem' },
  };

  const content = (
    <div className="h-full flex flex-col justify-between p-3 select-none">
      {/* Top Header & Brand */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 p-0.5 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Pill className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Pharma<span className="text-blue-600 dark:text-blue-400">Hub</span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Enterprise ERP</p>
              </motion.div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white items-center justify-center transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)] scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Information & Logout */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {user?.name ? user.name[0] : 'U'}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'User Name'}
              </p>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block truncate">
                {user?.role || 'ROLE'}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
          title="Logout"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Animated Sidebar */}
      <motion.aside
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden md:block h-screen saas-card border-r sticky top-0 z-30 shrink-0"
      >
        {content}
      </motion.aside>

      {/* Mobile Slide-in Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute left-0 top-0 bottom-0 w-64 saas-card z-10 shadow-2xl"
            >
              {content}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
