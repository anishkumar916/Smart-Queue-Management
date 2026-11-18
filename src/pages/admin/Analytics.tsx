import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Activity,
  AlertTriangle,
  Zap,
  Sparkles,
  PieChart as PieIcon,
  Calendar
} from 'lucide-react';
import { adminService, AnalyticsData } from '../../services/adminService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatsCard } from '../../components/StatsCard';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAnalytics().then(res => {
      if (res.success) setAnalytics(res.analytics);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating throughput & statistical metrics..." size="lg" />;
  }

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

  const pieData = analytics?.serviceDemand?.map((item, index) => ({
    name: item.name,
    value: item.tokens
  })) || [];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Analytics & Predictions
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Queue Performance Telemetry
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Deep statistical metrics, throughput velocities, and dynamic bottleneck detection.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Tokens Generated"
          value={analytics?.totalTokens || 0}
          icon={Activity}
          color="indigo"
          subtitle="Total volume"
        />
        <StatsCard
          title="Tokens Completed"
          value={analytics?.completedCount || 0}
          icon={CheckCircle}
          color="emerald"
          subtitle="Successful finishes"
        />
        <StatsCard
          title="Avg Service Duration"
          value={`${analytics?.avgServiceTime || 7}m`}
          icon={Clock}
          color="amber"
          subtitle="Time with staff"
        />
        <StatsCard
          title="Peak Traffic Window"
          value={analytics?.peakHour || '11:00 AM'}
          icon={Zap}
          color="cyan"
          subtitle="Highest inflow hour"
        />
      </div>

      {/* SMART INSIGHTS BOX */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 shadow-md space-y-4">
        <div className="flex items-center gap-2 text-indigo-400">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-bold text-sm text-white">Dynamic Queue Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {analytics?.insights && analytics.insights.map((insight, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white/5 dark:bg-slate-950/40 border border-white/10 text-xs text-indigo-100 flex items-start gap-2.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
              <span className="leading-relaxed">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Volume Trend */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Hourly Inflow vs Completed
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.hourlyData || []}>
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="tokens"
                  name="Tokens Issued"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Tokens Completed"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Demand Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Service Demand Distribution
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#ffffff'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No service completion data available yet.</p>
            )}
          </div>
        </div>

        {/* Counter Workload */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Counter Workload & Throughput
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.counterLoad || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
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
                <Bar dataKey="processed" name="Customers Served" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
