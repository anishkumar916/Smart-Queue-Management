import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Clock,
  History,
  User,
  Sliders,
  Building2,
  GitBranch,
  Layers,
  MonitorCheck,
  Users2,
  BarChart3,
  FileText,
  QrCode,
  Shield,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const customerItems = [
    { name: 'My Dashboard', path: '/customer', icon: LayoutDashboard },
    { name: 'Join Queue', path: '/customer/join', icon: Ticket },
    { name: 'Live Queue Track', path: '/customer/track', icon: Activity },
    { name: 'Token History', path: '/customer/history', icon: History },
    { name: 'My Profile', path: '/customer/profile', icon: User }
  ];

  const staffItems = [
    { name: 'Staff Dashboard', path: '/staff', icon: LayoutDashboard },
    { name: 'Queue Desk', path: '/staff/queue', icon: MonitorCheck },
    { name: 'FastPass QR Scanner', path: '/staff/scan', icon: QrCode },
    { name: 'Staff Profile', path: '/staff/profile', icon: User }
  ];

  const adminItems = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Analytics & Insights', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Organizations', path: '/admin/organizations', icon: Building2 },
    { name: 'Branches', path: '/admin/branches', icon: GitBranch },
    { name: 'Services', path: '/admin/services', icon: Layers },
    { name: 'Counters', path: '/admin/counters', icon: MonitorCheck },
    { name: 'Staff & Roles', path: '/admin/staff', icon: Users2 },
    { name: 'Customer Base', path: '/admin/customers', icon: User },
    { name: 'Audit Reports', path: '/admin/reports', icon: FileText },
    { name: 'Queue Settings', path: '/admin/settings', icon: Sliders }
  ];

  const items = role === 'ADMIN' ? adminItems : role === 'STAFF' ? staffItems : customerItems;

  return (
    <aside className="w-64 shrink-0 hidden lg:block border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 min-h-[calc(100vh-4rem)] p-4">
      {/* Role Indicator Banner */}
      <div className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
            {(role || 'U').charAt(0)}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {user.name || 'User'}
            </h4>
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
              {role} PORTAL
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2 block">
          Navigation
        </span>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin' || item.path === '/customer' || item.path === '/staff'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
