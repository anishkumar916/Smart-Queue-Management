import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { User, Briefcase, GitBranch, MonitorCheck, Mail, ShieldCheck } from 'lucide-react';

export const StaffProfile: React.FC = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    adminService.getBranches().then(res => {
      if (res.success) setBranches(res.branches || []);
    });
  }, []);

  if (!user) return null;

  const branch = branches.find(b => b._id === user.branchId);

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Staff Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Operator credentials and desk assignments
        </p>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Staff Operator
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Verified Counter Staff
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 uppercase font-semibold text-[10px] block">Email</span>
            <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
              <Mail className="w-4 h-4 text-indigo-500" />
              <span>{user.email}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 uppercase font-semibold text-[10px] block">Assigned Branch</span>
            <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
              <GitBranch className="w-4 h-4 text-purple-500" />
              <span>{branch?.name || 'Metropolis Central Branch'}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 uppercase font-semibold text-[10px] block">Role Authority</span>
            <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
              <Briefcase className="w-4 h-4 text-emerald-500" />
              <span>Counter Queue Operator</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 uppercase font-semibold text-[10px] block">Station ID</span>
            <div className="font-mono text-slate-700 dark:text-slate-300">
              {user._id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
