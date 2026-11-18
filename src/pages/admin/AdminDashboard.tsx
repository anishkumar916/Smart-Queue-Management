import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  CheckCircle,
  Activity,
  Layers,
  GitBranch,
  Building2,
  TrendingUp,
  Sliders,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { adminService, AdminStats, AnalyticsData } from '../../services/adminService';
import { StatsCard } from '../../components/StatsCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getDashboardStats(),
      adminService.getAnalytics()
    ]).then(([statsRes, anaRes]) => {
      if (statsRes.success) setStats(statsRes.stats);
      if (anaRes.success) setAnalytics(anaRes.analytics);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner message="Aggregating queue telemetry..." size="lg" />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Smart Queue Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time throughput, active queue telemetry, and institutional capacity insights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Deep Analytics
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Tokens Today"
          value={stats?.tokensToday || 0}
          icon={Activity}
          color="indigo"
          subtitle="Issued across branches"
        />
        <StatsCard
          title="Completed Tokens"
          value={stats?.completedToday || 0}
          icon={CheckCircle}
          color="emerald"
          subtitle="Successfully served"
        />
        <StatsCard
          title="Active Queues"
          value={stats?.activeQueues || 0}
          icon={Users}
          color="amber"
          subtitle="Currently waiting"
        />
        <StatsCard
          title="Avg Waiting Time"
          value={`${stats?.averageWaitingTime || 8}m`}
          icon={Clock}
          color="rose"
          subtitle="Wait to counter"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Customers</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats?.totalCustomers || 10}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Active Staff</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats?.activeStaff || 2} operators</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Active Services</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats?.totalServices || 5} categories</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Active Branches</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats?.totalBranches || 2} locations</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Volume */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hourly Queue Volume Today
              </h3>
              <p className="text-xs text-slate-500">Tokens issued vs completed by hour</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              Peak: {analytics?.peakHour || '11:00 AM'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.hourlyData || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#ffffff'
                  }}
                />
                <Bar dataKey="tokens" name="Tokens Generated" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Tokens Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Smart Insights */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Statistical Prediction Insights
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              System Health & Dynamic Insights
            </h3>
            <p className="text-xs text-slate-500">Derived directly from current queue & completion records</p>

            <div className="mt-4 space-y-2.5">
              {analytics?.insights && analytics.insights.length > 0 ? (
                analytics.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5"></div>
                    <span className="leading-relaxed">{insight}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Queue is performing within normal statistical parameters.</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Continuous rolling prediction model</span>
            <Link
              to="/admin/settings"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Configure Settings
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
