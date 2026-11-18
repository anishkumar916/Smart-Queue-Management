import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple';
  isMonospace?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo',
  isMonospace = false
}) => {
  const colorMap = {
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-indigo-500/20 shadow-indigo-500/10',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 ring-emerald-500/20 shadow-emerald-500/10',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 ring-amber-500/20 shadow-amber-500/10',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 ring-rose-500/20 shadow-rose-500/10',
    cyan: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 ring-cyan-500/20 shadow-cyan-500/10',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 ring-purple-500/20 shadow-purple-500/10'
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.02)] dark:shadow-[0_15px_35px_-8px_rgba(0,0,0,0.45)] hover:shadow-[0_20px_45px_-10px_rgba(99,102,241,0.18)] hover:-translate-y-1 transition-all duration-300">
      {/* Subtle Top Glow line */}
      <div className="absolute inset-x-6 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/30 dark:via-indigo-400/30 to-transparent group-hover:via-indigo-500 transition-all duration-500" />

      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-2xl ring-1 shadow-xs transition-transform duration-300 group-hover:scale-110 ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h3
          className={`text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white ${
            isMonospace ? 'font-mono' : ''
          }`}
        >
          {value}
        </h3>
        {trend && (
          <div
            className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
              trend.isPositive
                ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 mr-1 shrink-0" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 mr-1 shrink-0" />
            )}
            {trend.value}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};
