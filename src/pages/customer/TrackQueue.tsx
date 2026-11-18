import React, { useState, useEffect } from 'react';
import { QueueStatus } from '../../components/QueueStatus';
import { WaitTimeCard } from '../../components/WaitTimeCard';
import { tokenService, Token } from '../../services/tokenService';
import { adminService } from '../../services/adminService';
import { queueService, QueuePrediction } from '../../services/queueService';
import { useSocket } from '../../hooks/useSocket';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Activity, Ticket, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrackQueue: React.FC = () => {
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [boardData, setBoardData] = useState<any>({
    nowServing: '--',
    next: '--',
    waiting: [],
    totalWaiting: 0,
    activeCounters: 1
  });
  const [prediction, setPrediction] = useState<QueuePrediction | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user's active token & branches
  useEffect(() => {
    Promise.all([
      tokenService.getMyTokens(),
      adminService.getBranches()
    ]).then(([tokenRes, branchRes]) => {
      if (tokenRes.success && tokenRes.activeToken) {
        setActiveToken(tokenRes.activeToken);
        setSelectedBranchId(tokenRes.activeToken.branchId);
      } else if (branchRes.success && branchRes.branches?.length > 0) {
        setSelectedBranchId(branchRes.branches[0]._id);
      }
      if (branchRes.success) {
        setBranches(branchRes.branches || []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const refreshBoardAndPrediction = () => {
    if (!selectedBranchId) return;

    queueService.getQueueStatusBoard(selectedBranchId).then(res => {
      if (res.success) {
        setBoardData(res);
      }
    });

    queueService.getPrediction(selectedBranchId).then(res => {
      if (res.success && res.prediction) {
        setPrediction(res.prediction);
      }
    });
  };

  useEffect(() => {
    refreshBoardAndPrediction();
  }, [selectedBranchId]);

  // Real-time synchronization
  useSocket({
    branchId: selectedBranchId,
    tokenNumber: activeToken?.tokenNumber,
    onQueueUpdated: () => {
      refreshBoardAndPrediction();
    },
    onTokenCalled: () => {
      refreshBoardAndPrediction();
    },
    onServiceCompleted: () => {
      refreshBoardAndPrediction();
    }
  });

  if (loading) {
    return <LoadingSpinner message="Connecting to live queue..." size="lg" />;
  }

  const selectedBranch = branches.find(b => b._id === selectedBranchId);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500 animate-pulse" />
            Live Queue Monitor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time queue tracking updated directly by active service counters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {branches.length > 0 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              style={{ color: '#ffffff' }}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            >
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={refreshBoardAndPrediction}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Token Callout (if customer holds one) */}
      {activeToken && activeToken.branchId === selectedBranchId && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white font-mono font-bold text-sm">
              {activeToken.tokenNumber}
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                You are currently in this queue!
              </h4>
              <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                Status: {activeToken.status} • Position #{activeToken.queuePosition}
              </p>
            </div>
          </div>

          <Link
            to={`/customer/token/${activeToken._id}`}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition text-center shrink-0"
          >
            View Fast-Pass
          </Link>
        </div>
      )}

      {/* Real-time Display Board */}
      <QueueStatus
        nowServing={boardData.nowServing}
        next={boardData.next}
        waiting={boardData.waiting}
        totalWaiting={boardData.totalWaiting}
        activeCounters={boardData.activeCounters}
        estimatedWaitMinutes={prediction?.estimatedWaitMinutes || boardData.totalWaiting * 4 || 6}
        branchName={selectedBranch ? selectedBranch.name : 'Branch Queue'}
      />

      {/* Prediction Engine Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WaitTimeCard
          prediction={prediction}
          peopleAhead={boardData.totalWaiting}
          estimatedWaitMinutes={prediction?.estimatedWaitMinutes || 8}
        />

        {/* Counter Status Overview */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Currently Active Counters
          </h3>
          {boardData.servingList && boardData.servingList.length > 0 ? (
            <div className="space-y-2">
              {boardData.servingList.map((item: any) => (
                <div
                  key={item._id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {item.counterName}
                    </span>
                    <span className="text-[11px] text-slate-500">{item.serviceName}</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
                    {item.tokenNumber}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4">No tokens currently being served at counters.</p>
          )}
        </div>
      </div>
    </div>
  );
};
