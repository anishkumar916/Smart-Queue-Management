import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Ticket,
  Clock,
  Users,
  MapPin,
  Calendar,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Share2
} from 'lucide-react';
import { tokenService, Token } from '../../services/tokenService';
import { QRCodeDisplay } from '../../components/QRCodeDisplay';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useSocket } from '../../hooks/useSocket';

export const TokenDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      const res = await tokenService.getTokenById(id);
      if (res.success && res.token) {
        setToken(res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Token not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Live real-time sync for this specific token
  useSocket({
    branchId: token?.branchId,
    tokenNumber: token?.tokenNumber,
    onQueueUpdated: () => {
      fetchDetails();
    },
    onTokenCalled: (t: any) => {
      if (t._id === id) fetchDetails();
    },
    onServiceCompleted: (t: any) => {
      if (t._id === id) fetchDetails();
    }
  });

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this token?')) return;
    try {
      if (!id) return;
      await tokenService.cancelToken(id);
      navigate('/customer');
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading token details..." size="lg" />;
  }

  if (error || !token) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Token Not Found</h2>
        <p className="text-xs text-slate-500">{error}</p>
        <Link
          to="/customer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const peopleAhead = Math.max(0, (token.queuePosition || 1) - 1);
  const isActionable = ['WAITING', 'CALLED'].includes(token.status);

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/customer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Queues
        </Link>
        <span className="text-xs font-medium text-slate-400">
          ID: {token._id.substring(0, 8)}
        </span>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header Ribbon */}
        <div className="h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Digital Fast-Pass
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-black text-slate-900 dark:text-white mt-1">
                {token.tokenNumber}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {token.status}
              </span>
              {token.priority !== 'NORMAL' && (
                <span className="block mt-1 text-[10px] font-bold text-rose-500 uppercase">
                  {token.priority} Priority
                </span>
              )}
            </div>
          </div>

          {/* QR Code Presentation */}
          <div className="flex justify-center py-2">
            <QRCodeDisplay
              tokenNumber={token.tokenNumber}
              tokenId={token._id}
              qrTokenId={token.qrTokenId}
              branchId={token.branchId}
              serviceName={token.serviceName}
              size={180}
            />
          </div>

          {/* Status Metric Quad */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-center">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                People Ahead
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {token.status === 'WAITING' ? peopleAhead : '0 (Your Turn)'}
              </span>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                Estimated Wait
              </span>
              <span className="text-xl font-bold text-amber-500">
                {token.status === 'WAITING' ? `~${token.estimatedWaitTime}m` : 'Ready'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                Serving Token
              </span>
              <span className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {token.currentServingTokenNumber || 'None'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                Counter
              </span>
              <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {token.counterName || 'Assigning...'}
              </span>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex justify-between py-1">
              <span>Service Category:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{token.serviceName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Branch Location:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{token.branchName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Issued Time:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {new Date(token.createdAt).toLocaleString()}
              </span>
            </div>
            {token.calledAt && (
              <div className="flex justify-between py-1 text-blue-600 dark:text-blue-400">
                <span>Called At:</span>
                <span>{new Date(token.calledAt).toLocaleTimeString()}</span>
              </div>
            )}
            {token.completedAt && (
              <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400">
                <span>Completed At:</span>
                <span>{new Date(token.completedAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <Link
              to="/customer/track"
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
            >
              Track Live Board
            </Link>

            {isActionable && (
              <button
                onClick={handleCancel}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cancel Token
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
