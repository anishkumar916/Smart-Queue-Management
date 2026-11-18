import React, { useState } from 'react';
import { Search, Clock, Users, ArrowRight, AlertCircle, CheckCircle2, Ticket, Sparkles } from 'lucide-react';
import { tokenService } from '../../services/tokenService';

export const TrackToken: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [tokenData, setTokenData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await tokenService.trackPublicToken(tokenInput.trim());
      if (res.success && res.token) {
        setTokenData(res.token);
      } else {
        setError('Token not found in system.');
      }
    } catch (err: any) {
      setError(err.message || 'Token not found. Please verify your token number.');
      setTokenData(null);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    WAITING: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    CALLED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800 animate-pulse',
    SERVING: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20',
    COMPLETED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    SKIPPED: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800',
    CANCELLED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800'
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-600/30">
          <Search className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Public Token Tracker
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Track your queue position, estimated waiting time, and counter status with zero login required.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSearch} className="p-2 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
        <div className="relative flex-1">
          <Ticket className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            required
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
            placeholder="Enter token number (e.g. A001, A005, A007)"
            className="w-full pl-11 pr-4 py-2.5 rounded-xl text-base font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white bg-transparent outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5"
        >
          <span>{loading ? 'Tracking...' : 'Track'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card */}
      {tokenData && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in zoom-in-95">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Verified Token
              </span>
              <div className="text-4xl font-mono font-black text-slate-900 dark:text-white mt-1">
                {tokenData.tokenNumber}
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                statusColors[tokenData.status] || 'bg-slate-100 text-slate-800'
              }`}
            >
              {tokenData.status}
            </span>
          </div>

          {/* Metric Quad */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Currently Serving
              </span>
              <span className="text-2xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                {tokenData.currentServingToken}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                People Ahead
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {tokenData.peopleAhead}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Estimated Wait
              </span>
              <span className="text-2xl font-bold text-amber-500">
                {tokenData.status === 'COMPLETED' ? 'Done' : `${tokenData.estimatedWaitTime} mins`}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Queue Position
              </span>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                #{tokenData.queuePosition}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span className="text-slate-400">Branch:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{tokenData.branchName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Service:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{tokenData.serviceName}</span>
            </div>
            {tokenData.counterName && (
              <div className="flex justify-between">
                <span className="text-slate-400">Designated Counter:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{tokenData.counterName}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
