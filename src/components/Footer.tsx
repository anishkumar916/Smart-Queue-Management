import React from 'react';
import { Layers, ShieldCheck, Activity, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                SMART<span className="text-indigo-600 dark:text-indigo-400">QUEUE</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Enterprise-grade smart queue management and statistical waiting-time prediction platform for hospitals, banking centers, citizen authorities, and service organizations.
            </p>
            <div className="flex items-center gap-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Real-Time Prediction Engine Operational
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Citizen & Customer
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/join" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Join Branch Queue
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Track Token Number
                </Link>
              </li>
              <li>
                <Link to="/live" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Public Digital Display
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  My Active Tokens
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Staff & Enterprise
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/staff" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Staff Counter Desk
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Admin Analytics
                </Link>
              </li>
              <li>
                <Link to="/admin/counters" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Counter Allocation
                </Link>
              </li>
              <li>
                <Link to="/admin/settings" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Queue Capacity Rules
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Smart Queue Management System. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Powered by Node.js, Express & MongoDB</span>
            <span>•</span>
            <span>Socket.IO Live Synchronization</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
