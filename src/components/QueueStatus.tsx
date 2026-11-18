import React from 'react';
import { Volume2, Users, Clock, Radio, Activity, MonitorCheck, Sparkles } from 'lucide-react';

interface QueueStatusProps {
  nowServing: string;
  next: string;
  waiting: string[];
  totalWaiting: number;
  activeCounters: number;
  estimatedWaitMinutes?: number;
  branchName?: string;
  isLive?: boolean;
  counterNumber?: string;
  servingList?: { tokenNumber: string; counterName?: string; serviceName?: string }[];
}

export const QueueStatus: React.FC<QueueStatusProps> = ({
  nowServing = '--',
  next = '--',
  waiting = [],
  totalWaiting = 0,
  activeCounters = 1,
  estimatedWaitMinutes = 10,
  branchName = 'Branch Queue',
  isLive = true,
  counterNumber = 'Desk 1',
  servingList = []
}) => {
  return (
    <div className="relative rounded-3xl bg-slate-900 dark:bg-slate-950 text-white p-6 sm:p-8 lg:p-10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)] border border-slate-800 overflow-hidden">
      {/* 3D Background Lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400">
              SMART QUEUE SIGNAGE DISPLAY
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live TV Feed
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            {branchName}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs shadow-inner">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-200">Real-Time Sync</span>
          </div>
        </div>
      </div>

      {/* Main Boards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 relative z-10">
        {/* PROMINENT 3D CURRENT SERVING TOKEN */}
        <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/90 via-indigo-950/90 to-slate-900 p-8 border-2 border-indigo-400/40 shadow-[0_20px_50px_-10px_rgba(99,102,241,0.35)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                NOW SERVING
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="px-3 py-1 rounded-xl bg-indigo-500/30 border border-indigo-400/40 text-xs font-bold text-indigo-200 flex items-center gap-1.5 shadow-sm">
              <MonitorCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{counterNumber}</span>
            </div>
          </div>

          <div className="my-4 text-center sm:text-left">
            <div className="text-6xl sm:text-7xl lg:text-8xl font-mono font-black tracking-tight text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
              {nowServing}
            </div>
            <p className="text-xs sm:text-sm text-indigo-200/80 font-medium mt-3">
              Please proceed to <span className="font-bold text-white">{counterNumber}</span> with your fast-pass.
            </p>
          </div>

          <div className="pt-4 border-t border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300">
            <span>Audio Prompt: Active</span>
            <Volume2 className="w-4 h-4 text-indigo-300 animate-pulse" />
          </div>
        </div>

        {/* NEXT IN LINE 3D DISPLAY */}
        <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-slate-850 via-slate-900 to-slate-900 p-8 border border-slate-700/80 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              NEXT IN LINE
            </span>
            <div className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/30 text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Get Ready</span>
            </div>
          </div>

          <div className="my-4 text-center sm:text-left">
            <div className="text-6xl sm:text-7xl font-mono font-black tracking-tight text-amber-300 drop-shadow-md">
              {next}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-3">
              Please keep your QR pass ready on your phone or printed receipt.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Estimated Call</span>
            <span className="font-bold text-amber-300">Within ~{Math.max(2, estimatedWaitMinutes)} min</span>
          </div>
        </div>
      </div>

      {/* MULTI-COUNTER ACTIVE DESKS (if available) */}
      {servingList && servingList.length > 1 && (
        <div className="mb-8 p-5 rounded-2xl bg-slate-800/40 border border-slate-800 relative z-10">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 block">
            All Active Desks:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {servingList.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-850 border border-slate-700/60 text-center"
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  {item.counterName || `Counter ${idx + 1}`}
                </span>
                <span className="font-mono text-xl font-black text-white">
                  {item.tokenNumber}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WAITING LIST TOKENS */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 mb-8 relative z-10 shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Waiting in Line ({totalWaiting} customers)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Upcoming tokens</span>
        </div>

        {waiting.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {waiting.map((tokenNum, index) => (
              <span
                key={tokenNum}
                className={`px-3.5 py-2 rounded-xl font-mono text-base font-black border transition-all ${
                  index === 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-2 ring-amber-500/30'
                    : 'bg-slate-800/90 text-slate-200 border-slate-700 shadow-xs'
                }`}
              >
                {tokenNum}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-3">No other customers currently waiting in this queue.</p>
        )}
      </div>

      {/* METRIC FOOTER BAR */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800/80 text-xs relative z-10">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-500">Estimated Average Wait</span>
            <span className="text-base font-black text-slate-100">{estimatedWaitMinutes} mins</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-500">Active Service Bays</span>
            <span className="text-base font-black text-slate-100">{activeCounters} Desk(s) Open</span>
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 flex items-center gap-3 text-slate-400">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-500">Waiting Status</span>
            <span className="text-base font-black text-slate-100">
              {totalWaiting > 12 ? 'High Demand' : totalWaiting > 5 ? 'Steady Flow' : 'Low Wait Time'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default QueueStatus;
