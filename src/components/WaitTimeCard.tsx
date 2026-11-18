import React from 'react';
import { Clock, Users, Zap, ShieldCheck, HelpCircle } from 'lucide-react';
import { QueuePrediction } from '../services/queueService';

interface WaitTimeCardProps {
  prediction?: QueuePrediction | null;
  peopleAhead?: number;
  estimatedWaitMinutes?: number;
}

export const WaitTimeCard: React.FC<WaitTimeCardProps> = ({
  prediction,
  peopleAhead = 0,
  estimatedWaitMinutes = 10
}) => {
  const waitTime = prediction ? prediction.estimatedWaitMinutes : estimatedWaitMinutes;
  const ahead = prediction ? prediction.peopleAhead : peopleAhead;
  const avgServiceTime = prediction ? prediction.averageServiceTimeMinutes : 8;
  const activeCounters = prediction ? prediction.activeCounters : 2;
  const confidencePercent = prediction ? Math.round(prediction.confidenceScore * 100) : 85;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Smart Waiting-Time Prediction
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Statistical forecasting engine</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{confidencePercent}% Accuracy</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 my-3">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-center">
          <Clock className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {waitTime} <span className="text-sm font-normal text-slate-500">mins</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Estimated Waiting Time</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-center">
          <Users className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {ahead}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {ahead === 1 ? '1 Person Ahead' : `${ahead} People Ahead`}
          </span>
        </div>
      </div>

      {/* Explanation banner */}
      <div className="mt-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-600 dark:text-slate-400">
        <p className="font-medium text-indigo-950 dark:text-indigo-200 mb-1">
          Formula: (Ahead × Avg Service Duration) ÷ Active Counters
        </p>
        <p className="text-[11px] leading-relaxed">
          {prediction?.explanation ||
            `Calculated from ${ahead} waiting customers, ${activeCounters} active counters, and a rolling average service duration of ${avgServiceTime} mins.`}
        </p>
      </div>
    </div>
  );
};
