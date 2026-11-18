import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, Clock, Calendar, Search } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const Reports: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAnalytics().then(res => {
      if (res.success) setAnalytics(res.analytics);
    }).finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner message="Generating audit reports..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            Audit & Performance Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Exportable compliance logs, historical queue metrics, and throughput summaries.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export / Print Report
        </button>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Institutional Throughput Summary
          </h3>
          <p className="text-xs text-slate-500">Generated on {new Date().toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Tokens</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {analytics?.totalTokens || 0}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Completed</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {analytics?.completedCount || 0}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Average Wait Time</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {analytics?.avgWaitingTime || 8}m
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Average Service Duration</span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {analytics?.avgServiceTime || 7}m
            </div>
          </div>
        </div>

        {/* Breakdown table */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Service Demand Breakdown</h4>
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Service Category</th>
                  <th className="px-4 py-3">Tokens Issued</th>
                  <th className="px-4 py-3">Throughput Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {analytics?.serviceDemand?.map((s: any, idx: number) => {
                  const share = analytics.totalTokens > 0 ? Math.round((s.tokens / analytics.totalTokens) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{s.name}</td>
                      <td className="px-4 py-3 font-mono">{s.tokens}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${share}%` }} />
                          </div>
                          <span className="font-semibold text-[11px]">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
