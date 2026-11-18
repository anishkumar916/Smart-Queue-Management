import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Clock,
  Users,
  Activity,
  PlusCircle,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tokenService, Token } from '../../services/tokenService';
import { TokenCard } from '../../components/TokenCard';
import { WaitTimeCard } from '../../components/WaitTimeCard';
import { QueueProgressVisualizer } from '../../components/QueueProgressVisualizer';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useSocket } from '../../hooks/useSocket';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [history, setHistory] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTokens = async () => {
    try {
      const res = await tokenService.getMyTokens();
      if (res.success) {
        setActiveToken(res.activeToken || null);
        setHistory(res.history || []);
      }
    } catch (err) {
      console.error('Failed to load user tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  // Listen for real-time updates for active token
  useSocket({
    branchId: activeToken?.branchId,
    userId: user?._id,
    tokenNumber: activeToken?.tokenNumber,
    onQueueUpdated: () => {
      fetchTokens();
    },
    onTokenCalled: (token: any) => {
      if (token._id === activeToken?._id) {
        fetchTokens();
      }
    },
    onServiceCompleted: (token: any) => {
      if (token._id === activeToken?._id) {
        fetchTokens();
      }
    }
  });

  const handleCancelToken = async (tokenId: string) => {
    if (!window.confirm('Are you sure you want to cancel this token?')) return;
    try {
      await tokenService.cancelToken(tokenId);
      await fetchTokens();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel token');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your queue status..." size="lg" />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Customer Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {(user?.name || 'User').split(' ')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200/80">
            {activeToken
              ? `You currently hold active token ${activeToken.tokenNumber}.`
              : 'You have no active queues. Join a queue whenever you are ready.'}
          </p>
        </div>

        <div className="relative z-10">
          {!activeToken ? (
            <Link
              to="/customer/join"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs sm:text-sm shadow-md transition"
            >
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              Join New Queue
            </Link>
          ) : (
            <Link
              to="/customer/track"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-500/30 hover:bg-indigo-500/40 text-white border border-indigo-400/30 font-semibold text-xs transition"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              Track Live Board
            </Link>
          )}
        </div>
      </div>

      {/* ACTIVE TOKEN SECTION */}
      {activeToken ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-500" />
              Active Pass
            </h2>
            <TokenCard
              token={activeToken}
              onCancel={handleCancelToken}
              showQRByDefault={true}
            />
          </div>

          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Estimated Wait
            </h2>
            <WaitTimeCard
              peopleAhead={Math.max(0, (activeToken.queuePosition || 1) - 1)}
              estimatedWaitMinutes={activeToken.estimatedWaitTime || 8}
            />

            <QueueProgressVisualizer
              myTokenNumber={activeToken.tokenNumber}
              queuePosition={activeToken.queuePosition || 1}
              peopleAhead={Math.max(0, (activeToken.queuePosition || 1) - 1)}
              estimatedWaitMinutes={activeToken.estimatedWaitTime || 8}
              status={activeToken.status}
            />
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Ticket}
          title="No Active Queues"
          description="You don't have any waiting tokens right now. Pick an organization and branch to generate your digital token."
          actionText="Join a Queue Now"
          onAction={() => window.location.assign('/customer/join')}
        />
      )}

      {/* RECENT TOKEN HISTORY */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              Recent Visits
            </h2>
            <Link
              to="/customer/history"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View Full History
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.slice(0, 3).map((token) => (
              <TokenCard key={token._id} token={token} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
