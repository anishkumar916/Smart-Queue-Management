import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, MapPin, QrCode, AlertTriangle, ArrowRight, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { Token } from '../services/tokenService';
import { QRCodeDisplay } from './QRCodeDisplay';

interface TokenCardProps {
  token: Token;
  onCancel?: (tokenId: string) => void;
  showQRByDefault?: boolean;
  isProminent?: boolean;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  onCancel,
  showQRByDefault = false,
  isProminent = false
}) => {
  const [showQR, setShowQR] = useState(showQRByDefault || isProminent);

  const statusColors: Record<string, string> = {
    WAITING: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    CALLED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800 animate-pulse',
    SERVING: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20',
    COMPLETED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    SKIPPED: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800',
    CANCELLED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800'
  };

  const isActionable = ['WAITING', 'CALLED'].includes(token.status);
  const peopleAhead = Math.max(0, (token.queuePosition || 1) - 1);

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all duration-300 ${
        isProminent
          ? 'shadow-[0_25px_50px_-12px_rgba(99,102,241,0.18),0_0_0_1px_rgba(99,102,241,0.1)] hover:shadow-[0_30px_60px_-15px_rgba(99,102,241,0.25)] hover:-translate-y-1'
          : 'shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)] dark:shadow-[0_15px_35px_-8px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-0.5'
      }`}
    >
      {/* 3D Top Multi-layered Accent Header */}
      <div className="h-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-sm" />

      <div className="p-6">
        {/* Top Identification Hierarchy */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {isProminent ? 'YOUR ACTIVE TOKEN' : 'DIGITAL FAST-PASS'}
              </span>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  statusColors[token.status] || 'bg-slate-100 text-slate-800'
                }`}
              >
                {token.status}
              </span>
              {token.priority !== 'NORMAL' && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500 text-white uppercase tracking-wider shadow-xs">
                  {token.priority}
                </span>
              )}
            </div>

            {/* Token Number in Bold Monospace */}
            <h2 className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-slate-900 dark:text-white drop-shadow-xs">
              {token.tokenNumber}
            </h2>
          </div>

          <button
            onClick={() => setShowQR(!showQR)}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition shadow-xs active:scale-95 cursor-pointer"
            title="Toggle Fast-Pass QR Code"
          >
            <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </button>
        </div>

        {/* 3D Elevated Info Bar: People Ahead & Estimated Wait */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-850/80 dark:to-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs mb-5 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                PEOPLE AHEAD
              </p>
              <p className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {token.status === 'WAITING' ? `${peopleAhead} ahead` : 'Your turn!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                ESTIMATED WAIT
              </p>
              <p className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {token.status === 'WAITING' ? `~${token.estimatedWaitTime} min` : (token.status === 'SERVING' ? 'Serving now' : '0 min')}
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Presentation Area with Depth */}
        {showQR && (
          <div className="mb-5 animate-in fade-in zoom-in-95">
            <QRCodeDisplay
              tokenNumber={token.tokenNumber}
              tokenId={token._id}
              qrTokenId={token.qrTokenId}
              branchId={token.branchId}
              serviceName={token.serviceName}
              size={150}
            />
          </div>
        )}

        {/* Branch & Service details */}
        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-5">
          <div className="flex items-center justify-between py-0.5">
            <span className="font-medium text-slate-400">Service:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate ml-2">
              {token.serviceName || 'Standard Service'}
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="font-medium text-slate-400">Branch:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate ml-2">
              {token.branchName || 'Main Branch'}
            </span>
          </div>
          {token.counterName && (
            <div className="flex items-center justify-between py-0.5 text-indigo-600 dark:text-indigo-400">
              <span className="font-medium">Assigned Counter:</span>
              <span className="font-black font-mono">{token.counterName}</span>
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 gap-3">
          <Link
            to={`/customer/token/${token._id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition group-hover:translate-x-0.5"
          >
            <span>Full Ticket View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {isActionable && onCancel && (
            <button
              onClick={() => onCancel(token._id)}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-500 hover:underline cursor-pointer"
            >
              Cancel Token
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
